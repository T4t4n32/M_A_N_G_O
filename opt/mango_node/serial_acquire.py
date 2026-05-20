"""Acquire sensor readings from the ESP32 via serial.

Reads MANGO_JSON:{...} or KEY=val;KEY=val lines from the configured
serial port and stores each reading in the local SQLite database.
Run as a long-lived process supervised by Upstart or systemd.
"""

import json
import sys
import time

import serial  # type: ignore

from .config import (
    DEVICE_ID,
    READ_INTERVAL,
    SERIAL_BAUDRATE,
    SERIAL_PORT,
    SERIAL_TIMEOUT,
    VERBOSE,
)
from .db import insert_measurement


def parse_kv_line(line):
    """Parse KEY=val;KEY=val line into (temperature, ph, turbidity) or None."""
    try:
        parts = [p.strip() for p in line.split(";") if p.strip()]
        t = None
        ph = None
        turb = None
        for part in parts:
            if "=" not in part:
                continue
            k, v = part.split("=", 1)
            k = k.strip().lower()
            v = v.strip()
            try:
                val = float(v)
            except Exception:
                continue
            if k in ("temp", "t"):
                t = val
            elif k in ("ph", "pH"):
                ph = val
            elif k in ("turb", "tu", "turbidity"):
                turb = val
        if t is None and ph is None and turb is None:
            return None
        return (t, ph, turb)
    except Exception:
        return None


def parse_json_line(line):
    """Parse MANGO_JSON:{...} line into (temperature, ph, turbidity) or None."""
    prefix = "MANGO_JSON:"
    if not line.startswith(prefix):
        return None
    raw = line[len(prefix):].strip()
    try:
        obj = json.loads(raw)
    except Exception:
        return None
    t = None
    ph = None
    turb = None
    if isinstance(obj, dict):
        try:
            if obj.get("t") is not None:
                t = float(obj["t"])
        except Exception:
            pass
        try:
            if obj.get("ph") is not None:
                ph = float(obj["ph"])
        except Exception:
            pass
        try:
            if obj.get("tu") is not None:
                turb = float(obj["tu"])
        except Exception:
            pass
    if t is None and ph is None and turb is None:
        return None
    return (t, ph, turb)


def classify_alert(ph, turb, temp):
    """Return 'normal', 'warning', or 'critical' based on sensor values."""
    severity = 0
    if ph is not None:
        if ph < 4.0 or ph > 10.5:
            severity = max(severity, 2)
        elif ph < 5.5 or ph > 9.5:
            severity = max(severity, 1)
    if turb is not None:
        if turb > 50:
            severity = max(severity, 2)
        elif turb > 10:
            severity = max(severity, 1)
    if temp is not None:
        if temp < 5 or temp > 40:
            severity = max(severity, 2)
        elif temp < 10 or temp > 35:
            severity = max(severity, 1)
    return {0: "normal", 1: "warning", 2: "critical"}[severity]


def _parse_seq(line):
    """Extract seq number from MANGO_JSON line if present."""
    prefix = "MANGO_JSON:"
    if not line.startswith(prefix):
        return None
    try:
        obj = json.loads(line[len(prefix):].strip())
        if isinstance(obj, dict):
            seq = obj.get("seq")
            if seq is not None:
                return int(seq)
    except Exception:
        pass
    return None


def _parse_device_id(line):
    """Extract device_id from MANGO_JSON line if present."""
    prefix = "MANGO_JSON:"
    if not line.startswith(prefix):
        return None
    try:
        obj = json.loads(line[len(prefix):].strip())
        if isinstance(obj, dict):
            return obj.get("device_id") or obj.get("did") or None
    except Exception:
        pass
    return None


def main():
    if VERBOSE:
        print("[serial] opening {} @ {}".format(SERIAL_PORT, SERIAL_BAUDRATE))
    while True:
        try:
            with serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=SERIAL_TIMEOUT) as ser:
                if VERBOSE:
                    print("[serial] port opened")
                while True:
                    try:
                        raw = ser.readline()
                        if not raw:
                            time.sleep(READ_INTERVAL)
                            continue
                        line = raw.decode(errors="ignore").strip()
                        if not line:
                            continue
                        parsed = parse_json_line(line)
                        if parsed is None:
                            parsed = parse_kv_line(line)
                        if parsed is None:
                            continue
                        temp, ph, turb = parsed
                        alert_level = classify_alert(ph, turb, temp)
                        seq = _parse_seq(line)
                        device_id = _parse_device_id(line) or DEVICE_ID
                        if seq is not None:
                            packet_id = "{}-{:08d}".format(device_id, int(seq))
                        else:
                            packet_id = None
                        insert_measurement(ph, turb, temp, alert_level,
                                           packet_id=packet_id,
                                           device_id=device_id,
                                           seq=seq)
                    except Exception as e:
                        if VERBOSE:
                            print("[serial] error: {}".format(e))
                        time.sleep(READ_INTERVAL)
        except Exception as e:
            if VERBOSE:
                print("[serial] serial port open failed: {}".format(e))
            time.sleep(2)


if __name__ == "__main__":
    from .db import init_db

    init_db()
    try:
        main()
    except KeyboardInterrupt:
        print("[serial] terminated by user")
        sys.exit(0)
