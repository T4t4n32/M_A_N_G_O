"""SMS alert dispatcher for M.A.N.G.O. edge node.

This process runs alongside the acquisition and sync services.
It watches the local SQLite database for measurements with a
non-normal alert level, evaluates them against the alert rules
fetched from the backend, and sends SMS notifications to the
configured contacts via the Huawei E3372H-153 modem.

Key behaviours:
  - Fetches alert config (rules + contacts) from the backend on
    startup and refreshes it every SMS_CONFIG_REFRESH_S seconds.
  - Applies a per-sensor-type cooldown to avoid flooding: once an
    SMS is sent for a given sensor + level, no further SMS is sent
    for SMS_COOLDOWN_S seconds.
  - Reports every SMS event (success or failure) to the backend via
    POST /api/v1/alerts/events so the log is centralised.
  - Never blocks the acquire or sync processes; runs as a separate
    long-lived process supervised by systemd.

Usage::

    python3 -m mango_node.sms_dispatch

Environment variables (see config.py for defaults):
  MANGO_SMS_ENABLED          — set to 0 to disable SMS without removing service
  MANGO_HUAWEI_GATEWAY       — modem IP, default 192.168.8.1
  MANGO_SMS_COOLDOWN_S       — seconds between SMS per sensor+level (default 1800)
  MANGO_SMS_CONFIG_REFRESH_S — how often to refresh config from backend (default 900)
  MANGO_SMS_POLL_S           — how often to check local DB for new alerts (default 15)
"""

from __future__ import annotations

import sys
import time
from datetime import datetime, timezone
from typing import Optional

import requests

from .config import (
    API_URL,
    INGEST_API_KEY,
    STATION_NAME,
    VERBOSE,
    SMS_ENABLED,
    SMS_COOLDOWN_S,
    SMS_CONFIG_REFRESH_S,
    SMS_POLL_S,
    HUAWEI_GATEWAY,
)
from .db import fetch_unsent_alerts, mark_sms_sent, fetch_latest_readings
from .huawei_api import send_sms, modem_available, get_inbox, delete_sms


def _log(msg: str) -> None:
    if VERBOSE:
        print(f"[sms] {msg}", flush=True)


def _backend_base() -> str:
    # Strip /ingest suffix to get the base API URL
    return API_URL.removesuffix("/ingest").removesuffix("/api/v1") + ""


def _alerts_base() -> str:
    base = API_URL.removesuffix("/ingest")
    if base.endswith("/api/v1"):
        return base + "/alerts"
    # Fallback: assume standard path
    parts = API_URL.split("/api/v1/")
    return parts[0] + "/api/v1/alerts"


def _fetch_alert_config() -> dict:
    """Fetch rules and contacts from the backend.

    Returns {"rules": [...], "contacts": [...]} on success,
    or {"rules": [], "contacts": []} on failure.
    """
    url = _alerts_base() + "/config"
    headers = {}
    if INGEST_API_KEY:
        headers["X-Api-Key"] = INGEST_API_KEY
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        _log(f"config fetched: {len(data.get('rules', []))} rules, {len(data.get('contacts', []))} contacts")
        return data
    except Exception as exc:
        _log(f"config fetch failed: {exc}")
        return {"rules": [], "contacts": []}


def _post_event(
    sensor_type: str,
    value: Optional[float],
    alert_level: str,
    phone: str,
    contact_id: Optional[int],
    rule_id: Optional[int],
    message: str,
    sms_sent: bool,
    sms_error: Optional[str],
    measured_at: Optional[str],
) -> None:
    url = _alerts_base() + "/events"
    headers = {"Content-Type": "application/json"}
    if INGEST_API_KEY:
        headers["X-Api-Key"] = INGEST_API_KEY

    payload = {
        "station_name": STATION_NAME,
        "sensor_type": sensor_type,
        "value": value,
        "alert_level": alert_level,
        "rule_id": rule_id,
        "contact_id": contact_id,
        "message": message,
        "sms_sent": sms_sent,
        "sms_sent_at": datetime.now(timezone.utc).isoformat() if sms_sent else None,
        "sms_error": sms_error,
        "measured_at": measured_at,
    }
    try:
        requests.post(url, json=payload, headers=headers, timeout=10)
    except Exception as exc:
        _log(f"event post failed: {exc}")


def _format_sms(sensor_type: str, value: Optional[float], alert_level: str) -> str:
    sensor_labels = {"ph": "pH", "temperature": "Temperatura", "turbidity": "Turbidez"}
    units = {"ph": "", "temperature": " °C", "turbidity": " NTU"}
    label = sensor_labels.get(sensor_type, sensor_type.upper())
    unit = units.get(sensor_type, "")
    val_str = f"{value:.2f}{unit}" if value is not None else "N/D"
    level_str = "ADVERTENCIA" if alert_level == "warning" else "CRITICO"
    return (
        f"MANGO ALERTA [{level_str}] "
        f"Estacion: {STATION_NAME} | "
        f"{label}: {val_str} | "
        f"{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC"
    )[:160]


def _evaluate_rules(
    sensor_type: str, value: Optional[float], rules: list[dict]
) -> Optional[dict]:
    """Return the most severe triggered rule, or None."""
    if value is None:
        return None
    triggered = [
        r for r in rules
        if r.get("sensor_type") == sensor_type
        and r.get("enabled", True)
        and (
            (r["comparison"] == "above" and value > r["threshold"])
            or (r["comparison"] == "below" and value < r["threshold"])
        )
    ]
    if not triggered:
        return None
    # Return the critical rule if any, else warning
    for lvl in ("critical", "warning"):
        for r in triggered:
            if r.get("level") == lvl:
                return r
    return triggered[0]


def _build_status_reply(readings) -> str:
    """Build a compact STATUS reply from the latest local DB readings."""
    parts = []
    if readings:
        r = dict(readings)
        ph = r.get("ph")
        temp = r.get("temperature")
        turb = r.get("turbidity")
        ts = r.get("measured_at", "")[:16].replace("T", " ")
        if ph is not None:
            parts.append(f"pH:{ph:.2f}")
        if temp is not None:
            parts.append(f"T:{temp:.1f}C")
        if turb is not None:
            parts.append(f"Turb:{turb:.1f}NTU")
        parts.append(ts)
    if not parts:
        return f"MANGO {STATION_NAME} | Sin lecturas recientes"
    return f"MANGO {STATION_NAME} | " + " | ".join(parts)


def _handle_inbox(
    contacts: list[dict],
    sms_paused_until: float,
) -> float:
    """Read the modem inbox and handle commands from authorized contacts.

    Returns the updated sms_paused_until timestamp.
    """
    authorized_phones = {c["phone"] for c in contacts if c.get("phone")}
    if not authorized_phones:
        return sms_paused_until

    messages = get_inbox(HUAWEI_GATEWAY)
    for msg in messages:
        phone = msg["phone"]
        # Normalize phone: ensure E.164 prefix if missing
        if not phone.startswith("+") and len(phone) >= 10:
            phone = "+" + phone

        if phone not in authorized_phones:
            _log(f"inbox: message from unknown sender {phone} — ignored")
            delete_sms(msg["index"], HUAWEI_GATEWAY)
            continue

        cmd = msg["content"].strip().upper()
        _log(f"inbox: command '{cmd}' from {phone}")

        if cmd == "STATUS":
            readings = fetch_latest_readings()
            reply = _build_status_reply(readings)
            send_sms(phone, reply, gateway=HUAWEI_GATEWAY)

        elif cmd.startswith("SILENCIAR"):
            hours = 2
            parts = cmd.split()
            if len(parts) >= 2:
                token = parts[1].rstrip("H").rstrip("h")
                try:
                    hours = max(1, min(24, int(token)))
                except ValueError:
                    pass
            sms_paused_until = time.monotonic() + hours * 3600
            send_sms(phone, f"MANGO {STATION_NAME}: alertas silenciadas por {hours}h.", gateway=HUAWEI_GATEWAY)
            _log(f"SMS paused for {hours}h by {phone}")

        elif cmd == "REANUDAR":
            sms_paused_until = 0.0
            send_sms(phone, f"MANGO {STATION_NAME}: alertas reanudadas.", gateway=HUAWEI_GATEWAY)
            _log(f"SMS resumed by {phone}")

        elif cmd == "AYUDA":
            help_msg = "MANGO comandos: STATUS | SILENCIAR Nh | REANUDAR | AYUDA"
            send_sms(phone, help_msg, gateway=HUAWEI_GATEWAY)

        else:
            send_sms(phone, "Comando no reconocido. Envía AYUDA para ver los comandos.", gateway=HUAWEI_GATEWAY)

        delete_sms(msg["index"], HUAWEI_GATEWAY)

    return sms_paused_until


def main() -> None:
    if not SMS_ENABLED:
        _log("SMS dispatch disabled (SMS_ENABLED=0). Exiting.")
        return

    _log(f"starting — station={STATION_NAME} gateway={HUAWEI_GATEWAY}")

    config: dict = {"rules": [], "contacts": []}
    last_config_fetch: float = 0.0
    last_inbox_check: float = 0.0
    sms_paused_until: float = 0.0

    # cooldown tracker: (sensor_type, level) → last_sms_epoch
    cooldowns: dict[tuple[str, str], float] = {}

    while True:
        now = time.monotonic()

        # Refresh alert config from backend periodically
        if now - last_config_fetch >= SMS_CONFIG_REFRESH_S:
            config = _fetch_alert_config()
            last_config_fetch = now

        rules = config.get("rules", [])
        contacts = config.get("contacts", [])

        # Check SMS inbox for remote commands every 30 s
        if now - last_inbox_check >= 30:
            try:
                if modem_available(HUAWEI_GATEWAY):
                    sms_paused_until = _handle_inbox(contacts, sms_paused_until)
                last_inbox_check = now
            except Exception as exc:
                _log(f"inbox check error: {exc}")
                last_inbox_check = now

        # Respect pause requested via remote SMS command
        if time.monotonic() < sms_paused_until:
            _log("SMS alerts paused by remote command")
            time.sleep(SMS_POLL_S)
            continue

        if not contacts:
            _log("no active contacts configured — skipping dispatch")
            time.sleep(SMS_POLL_S)
            continue

        # Fetch measurements that triggered an alert but have not been SMS-notified
        rows = fetch_unsent_alerts(limit=20)
        if not rows:
            time.sleep(SMS_POLL_S)
            continue

        modem_ok = modem_available(HUAWEI_GATEWAY)
        if not modem_ok:
            _log("modem not reachable — will retry next cycle")
            time.sleep(SMS_POLL_S)
            continue

        for row in rows:
            row_id: int = row["id"]
            measured_at: str = row["measured_at"]
            alert_level: str = row["alert_level"]

            sensor_readings = {
                "ph": row["ph"],
                "temperature": row["temperature"],
                "turbidity": row["turbidity"],
            }

            any_sent = False
            for sensor_type, value in sensor_readings.items():
                if value is None:
                    continue

                triggered_rule = _evaluate_rules(sensor_type, value, rules)
                if not triggered_rule:
                    continue

                ck = (sensor_type, triggered_rule["level"])
                last_sent = cooldowns.get(ck, 0.0)
                if time.monotonic() - last_sent < SMS_COOLDOWN_S:
                    _log(f"cooldown active for {sensor_type}/{triggered_rule['level']} — skipping")
                    continue

                message = _format_sms(sensor_type, value, triggered_rule["level"])

                for contact in contacts:
                    phone = contact.get("phone", "")
                    if not phone:
                        continue
                    ok, err = send_sms(phone, message, gateway=HUAWEI_GATEWAY)
                    _log(
                        f"SMS to {phone} ({contact.get('name', '?')}): "
                        f"{'OK' if ok else 'FAIL: ' + str(err)}"
                    )
                    _post_event(
                        sensor_type=sensor_type,
                        value=value,
                        alert_level=triggered_rule["level"],
                        phone=phone,
                        contact_id=contact.get("id"),
                        rule_id=triggered_rule.get("id"),
                        message=message,
                        sms_sent=ok,
                        sms_error=err,
                        measured_at=measured_at,
                    )

                cooldowns[ck] = time.monotonic()
                any_sent = True

            mark_sms_sent(row_id)

        time.sleep(SMS_POLL_S)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("[sms] terminated by user")
        sys.exit(0)
