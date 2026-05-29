"""Modem watchdog for the Huawei E3372H-153 on Jetson edge nodes.

Responsibilities:
  1. Poll the modem every POLL_INTERVAL seconds.
  2. Write a status JSON sidecar to STATUS_FILE (read by local_api /edge/modem).
  3. Detect disconnection and attempt reconnect via HiLink API.
  4. Detect USB disappearance and attempt sysfs USB reset.
  5. Post modem telemetry to the VPS backend every TELEMETRY_INTERVAL seconds.

The sidecar file is written atomically (write-then-rename) so readers never
see a partial file. The watchdog is stateless across restarts — the modem
itself is the source of truth.
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone

import requests

from .config import (
    API_URL,
    INGEST_API_KEY,
    STATION_NAME,
    VERBOSE,
    HUAWEI_GATEWAY,
)
from .huawei_api import get_modem_snapshot, modem_available, reconnect

POLL_INTERVAL     = float(os.getenv("MANGO_MODEM_POLL_S",       "30"))
TELEMETRY_INTERVAL = float(os.getenv("MANGO_MODEM_TELEMETRY_S", "120"))
STATUS_FILE       = os.getenv("MANGO_MODEM_STATUS_FILE",
                               "/opt/mango_node/modem_status.json")
RECONNECT_DELAY_S = float(os.getenv("MANGO_MODEM_RECONNECT_DELAY_S", "15"))
MAX_FAILURES      = int(os.getenv("MANGO_MODEM_MAX_FAILURES", "3"))

# Huawei USB vendor ID
_HUAWEI_VID = "12d1"


def _log(msg):
    if VERBOSE:
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
        print("[modem {}] {}".format(ts, msg), flush=True)


def _telemetry_url():
    base = API_URL
    for suffix in ("/ingest/batch", "/ingest"):
        if base.endswith(suffix):
            base = base[: -len(suffix)]
            break
    return base.rstrip("/") + "/sync/telemetry"


def _write_status(snapshot: dict) -> None:
    """Atomically write snapshot to STATUS_FILE."""
    try:
        os.makedirs(os.path.dirname(STATUS_FILE) or ".", exist_ok=True)
        tmp = STATUS_FILE + ".tmp"
        with open(tmp, "w") as fh:
            json.dump(snapshot, fh)
        os.replace(tmp, STATUS_FILE)
    except Exception as exc:
        _log("status write failed: {}".format(exc))


def _post_telemetry(snapshot: dict) -> None:
    """POST modem snapshot to /api/v1/sync/telemetry on the VPS backend."""
    url = _telemetry_url()
    headers = {"Content-Type": "application/json"}
    if INGEST_API_KEY:
        headers["X-Api-Key"] = INGEST_API_KEY
    payload = {
        "device_id":    STATION_NAME,
        "station_name": STATION_NAME,
        "modem":        snapshot,
        "reported_at":  datetime.now(timezone.utc).isoformat(),
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        if resp.ok:
            _log("telemetry posted -> {}".format(resp.status_code))
        else:
            _log("telemetry POST {} {}".format(resp.status_code, resp.text[:80]))
    except Exception as exc:
        _log("telemetry POST failed: {}".format(exc))


def _usb_reset() -> bool:
    """Try to toggle the USB authorized flag to reset the Huawei device."""
    try:
        proc = subprocess.Popen(
            ["find", "/sys/bus/usb/devices", "-maxdepth", "2", "-name", "idVendor"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        stdout, _ = proc.communicate()
        for vp in stdout.decode("utf-8", errors="replace").splitlines():
            try:
                with open(vp) as fh:
                    if fh.read().strip().lower() != _HUAWEI_VID:
                        continue
            except OSError:
                continue
            dev_dir = os.path.dirname(vp)
            auth = os.path.join(dev_dir, "authorized")
            if not os.path.exists(auth):
                continue
            try:
                with open(auth, "w") as fh:
                    fh.write("0")
                time.sleep(2)
                with open(auth, "w") as fh:
                    fh.write("1")
                _log("USB reset triggered at {}".format(dev_dir))
                return True
            except OSError as exc:
                _log("USB authorized write failed: {}".format(exc))
    except Exception as exc:
        _log("USB reset error: {}".format(exc))
    return False


def _signal_bar_desc(bars) -> str:
    if bars is None:
        return "?"
    return "{}/5".format(bars)


def main():
    _log("starting - station={} gateway={} poll={}s telemetry={}s".format(
        STATION_NAME, HUAWEI_GATEWAY, POLL_INTERVAL, TELEMETRY_INTERVAL,
    ))

    last_telemetry = 0.0
    consecutive_failures = 0

    while True:
        snapshot = get_modem_snapshot(HUAWEI_GATEWAY)
        _write_status(snapshot)

        available = snapshot.get("available", False)

        if not available:
            consecutive_failures += 1
            _log("modem unreachable (failure #{})".format(consecutive_failures))
            if consecutive_failures >= MAX_FAILURES:
                _log("max failures reached - attempting USB reset")
                _usb_reset()
                time.sleep(RECONNECT_DELAY_S)
                consecutive_failures = 0
        else:
            if consecutive_failures:
                _log("modem recovered after {} failure(s)".format(consecutive_failures))
            consecutive_failures = 0

            connected    = snapshot.get("connected", False)
            network_type = snapshot.get("network_type", "?")
            operator     = snapshot.get("operator", "?")
            rssi         = snapshot.get("rssi")
            bars         = snapshot.get("signal_bars")

            _log("connected={} net={} op={} rssi={} dBm bars={}".format(
                connected, network_type, operator, rssi, _signal_bar_desc(bars),
            ))

            if not connected:
                _log("not connected - requesting reconnect via HiLink")
                ok = reconnect(HUAWEI_GATEWAY)
                _log("reconnect request: {}".format("accepted" if ok else "failed"))
                time.sleep(RECONNECT_DELAY_S)

        now = time.monotonic()
        if now - last_telemetry >= TELEMETRY_INTERVAL:
            _post_telemetry(snapshot)
            last_telemetry = time.monotonic()

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("[modem] terminated by user")
        sys.exit(0)
