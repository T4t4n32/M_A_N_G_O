"""SMS alert dispatcher for M.A.N.G.O. edge node.

Watches the local SQLite database for measurements with a non-normal
alert level, evaluates them against rules from the backend, and sends
SMS notifications via the Huawei E3372H-153 modem.
"""

import sys
import time
from datetime import datetime, timezone

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


def _log(msg):
    if VERBOSE:
        print("[sms] {}".format(msg), flush=True)


def _alerts_base():
    base = API_URL
    if base.endswith("/ingest"):
        base = base[:-len("/ingest")]
    if base.endswith("/api/v1"):
        return base + "/alerts"
    parts = API_URL.split("/api/v1/")
    return parts[0] + "/api/v1/alerts"


def _fetch_alert_config():
    """Fetch rules and contacts from the backend."""
    url = _alerts_base() + "/config"
    headers = {}
    if INGEST_API_KEY:
        headers["X-Api-Key"] = INGEST_API_KEY
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        _log("config fetched: {} rules, {} contacts".format(
            len(data.get("rules", [])), len(data.get("contacts", []))))
        return data
    except Exception as exc:
        _log("config fetch failed: {}".format(exc))
        return {"rules": [], "contacts": []}


def _post_event(sensor_type, value, alert_level, phone, contact_id,
                rule_id, message, sms_sent, sms_error, measured_at):
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
        _log("event post failed: {}".format(exc))


def _format_sms(sensor_type, value, alert_level):
    sensor_labels = {"ph": "pH", "temperature": "Temperatura", "turbidity": "Turbidez"}
    units = {"ph": "", "temperature": " C", "turbidity": " NTU"}
    label = sensor_labels.get(sensor_type, sensor_type.upper())
    unit = units.get(sensor_type, "")
    if value is not None:
        val_str = "{:.2f}{}".format(value, unit)
    else:
        val_str = "N/D"
    level_str = "ADVERTENCIA" if alert_level == "warning" else "CRITICO"
    msg = (
        "MANGO ALERTA [{}] Estacion: {} | {}: {} | {} UTC".format(
            level_str,
            STATION_NAME,
            label,
            val_str,
            datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        )
    )
    return msg[:160]


def _evaluate_rules(sensor_type, value, rules):
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
    for lvl in ("critical", "warning"):
        for r in triggered:
            if r.get("level") == lvl:
                return r
    return triggered[0]


def _build_status_reply(readings):
    """Build a compact STATUS reply from the latest local DB readings."""
    parts = []
    if readings:
        r = dict(readings)
        ph = r.get("ph")
        temp = r.get("temperature")
        turb = r.get("turbidity")
        ts = r.get("measured_at", "")[:16].replace("T", " ")
        if ph is not None:
            parts.append("pH:{:.2f}".format(ph))
        if temp is not None:
            parts.append("T:{:.1f}C".format(temp))
        if turb is not None:
            parts.append("Turb:{:.1f}NTU".format(turb))
        parts.append(ts)
    if not parts:
        return "MANGO {} | Sin lecturas recientes".format(STATION_NAME)
    return "MANGO {} | ".format(STATION_NAME) + " | ".join(parts)


def _handle_inbox(contacts, sms_paused_until):
    """Read the modem inbox and handle commands from authorized contacts."""
    authorized_phones = set(c["phone"] for c in contacts if c.get("phone"))
    if not authorized_phones:
        return sms_paused_until

    messages = get_inbox(HUAWEI_GATEWAY)
    for msg in messages:
        phone = msg["phone"]
        if not phone.startswith("+") and len(phone) >= 10:
            phone = "+" + phone

        if phone not in authorized_phones:
            _log("inbox: message from unknown sender {} -- ignored".format(phone))
            delete_sms(msg["index"], HUAWEI_GATEWAY)
            continue

        cmd = msg["content"].strip().upper()
        _log("inbox: command '{}' from {}".format(cmd, phone))

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
            send_sms(phone, "MANGO {}: alertas silenciadas por {}h.".format(
                STATION_NAME, hours), gateway=HUAWEI_GATEWAY)
            _log("SMS paused for {}h by {}".format(hours, phone))

        elif cmd == "REANUDAR":
            sms_paused_until = 0.0
            send_sms(phone, "MANGO {}: alertas reanudadas.".format(
                STATION_NAME), gateway=HUAWEI_GATEWAY)
            _log("SMS resumed by {}".format(phone))

        elif cmd == "AYUDA":
            help_msg = "MANGO comandos: STATUS | SILENCIAR Nh | REANUDAR | AYUDA"
            send_sms(phone, help_msg, gateway=HUAWEI_GATEWAY)

        else:
            send_sms(phone, "Comando no reconocido. Envia AYUDA para ver los comandos.",
                     gateway=HUAWEI_GATEWAY)

        delete_sms(msg["index"], HUAWEI_GATEWAY)

    return sms_paused_until


def main():
    if not SMS_ENABLED:
        _log("SMS dispatch disabled (SMS_ENABLED=0). Exiting.")
        return

    _log("starting -- station={} gateway={}".format(STATION_NAME, HUAWEI_GATEWAY))

    config = {"rules": [], "contacts": []}
    last_config_fetch = 0.0
    last_inbox_check = 0.0
    sms_paused_until = 0.0
    cooldowns = {}  # (sensor_type, level) -> last_sms_epoch

    while True:
        now = time.monotonic()

        if now - last_config_fetch >= SMS_CONFIG_REFRESH_S:
            config = _fetch_alert_config()
            last_config_fetch = now

        rules = config.get("rules", [])
        contacts = config.get("contacts", [])

        if now - last_inbox_check >= 30:
            try:
                if modem_available(HUAWEI_GATEWAY):
                    sms_paused_until = _handle_inbox(contacts, sms_paused_until)
                last_inbox_check = now
            except Exception as exc:
                _log("inbox check error: {}".format(exc))
                last_inbox_check = now

        if time.monotonic() < sms_paused_until:
            _log("SMS alerts paused by remote command")
            time.sleep(SMS_POLL_S)
            continue

        if not contacts:
            _log("no active contacts configured -- skipping dispatch")
            time.sleep(SMS_POLL_S)
            continue

        rows = fetch_unsent_alerts(limit=20)
        if not rows:
            time.sleep(SMS_POLL_S)
            continue

        modem_ok = modem_available(HUAWEI_GATEWAY)
        if not modem_ok:
            _log("modem not reachable -- will retry next cycle")
            time.sleep(SMS_POLL_S)
            continue

        for row in rows:
            row_id = row["id"]
            measured_at = row["measured_at"]
            alert_level = row["alert_level"]

            sensor_readings = {
                "ph": row["ph"],
                "temperature": row["temperature"],
                "turbidity": row["turbidity"],
            }

            for sensor_type, value in sensor_readings.items():
                if value is None:
                    continue

                triggered_rule = _evaluate_rules(sensor_type, value, rules)
                if not triggered_rule:
                    continue

                ck = (sensor_type, triggered_rule["level"])
                last_sent = cooldowns.get(ck, 0.0)
                if time.monotonic() - last_sent < SMS_COOLDOWN_S:
                    _log("cooldown active for {}/{} -- skipping".format(
                        sensor_type, triggered_rule["level"]))
                    continue

                message = _format_sms(sensor_type, value, triggered_rule["level"])

                for contact in contacts:
                    phone = contact.get("phone", "")
                    if not phone:
                        continue
                    ok, err = send_sms(phone, message, gateway=HUAWEI_GATEWAY)
                    _log("SMS to {} ({}): {}".format(
                        phone,
                        contact.get("name", "?"),
                        "OK" if ok else "FAIL: " + str(err),
                    ))
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

            mark_sms_sent(row_id)

        time.sleep(SMS_POLL_S)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("[sms] terminated by user")
        sys.exit(0)
