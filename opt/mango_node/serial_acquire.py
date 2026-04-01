"""Acquire sensor readings from the ESP32 via serial.

The Jetson inside the M.A.N.G.O. node does not read the sensors
directly.  Instead, an ESP32 board connected to the PT100,
turbidity and pH probes collects measurements and prints them
over its UART.  The firmware sends two kinds of messages:

* Plain key–value lines, e.g. ``TEMP=24.36;PH=7.12;TURB=183.4;TS=170000``【525100557324170†L70-L77】.
* JSON messages prefixed with ``MANGO_JSON:`` such as
  ``MANGO_JSON:{"t":24.36,"ph":7.12,"tu":183.4,"ts":170000}``.

This script opens the configured serial port and listens for such
lines.  When a valid payload is parsed, it extracts the three
primary sensor values (temperature in °C, pH, turbidity in NTU),
determines an alert level based on threshold ranges, and stores
the reading in the local SQLite database.  Logging is optional
and controlled by ``config.VERBOSE``.

Run this module as a long‑lived process.  It will keep reading
lines until terminated.  A systemd unit file can supervise it
and restart it automatically if it crashes.
"""

from __future__ import annotations

import json
import re
import sys
import time
from typing import Any, Dict, Optional, Tuple

import serial  # type: ignore

from .config import (
    SERIAL_PORT,
    SERIAL_BAUDRATE,
    SERIAL_TIMEOUT,
    READ_INTERVAL,
    VERBOSE,
)
from .db import insert_measurement


def parse_kv_line(line: str) -> Optional[Tuple[Optional[float], Optional[float], Optional[float]]]:
    """Parse a key–value semicolon separated line into sensor values.

    Recognised keys are ``TEMP``/``T`` for temperature (°C), ``PH``
    or ``pH`` for pH, and ``TURB``/``TU`` for turbidity (NTU).  The
    function is case‑insensitive.  Returns a tuple
    ``(temperature, ph, turbidity)`` where each value may be
    ``None`` if not present or could not be converted to float.
    """
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


def parse_json_line(line: str) -> Optional[Tuple[Optional[float], Optional[float], Optional[float]]]:
    """Parse a JSON payload prefixed with ``MANGO_JSON:``.

    The JSON object may contain keys ``t``, ``ph`` and ``tu``
    corresponding to temperature (°C), pH and turbidity (NTU).  Returns
    a tuple of floats or ``None`` when no recognised values are found.
    """
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


def classify_alert(ph: Optional[float], turb: Optional[float], temp: Optional[float]) -> str:
    """Return an alert level based on sensor values.

    Uses the threshold ranges defined in the frontend
    ``sensorThresholds.ts``: optimal ranges are pH 6.5–8.5, turbidity
    0–5 NTU and temperature 15–30 °C【780614701791613†L2-L35】.  Values outside the
    warning ranges (pH <5.5 or >9.5, turbidity >10, temperature
    <10 or >35) are considered warnings.  Values outside the
    critical ranges (pH <4 or >10.5, turbidity >50, temperature
    <5 or >40) are critical.  The most severe status across all
    present values is returned.
    """
    severity = 0  # 0=normal, 1=warning, 2=critical
    # pH thresholds
    if ph is not None:
        if ph < 4.0 or ph > 10.5:
            severity = max(severity, 2)
        elif ph < 5.5 or ph > 9.5:
            severity = max(severity, 1)
    # Turbidity thresholds (NTU)
    if turb is not None:
        if turb > 50:
            severity = max(severity, 2)
        elif turb > 10:
            severity = max(severity, 1)
    # Temperature thresholds (°C)
    if temp is not None:
        if temp < 5 or temp > 40:
            severity = max(severity, 2)
        elif temp < 10 or temp > 35:
            severity = max(severity, 1)
    return {0: "normal", 1: "warning", 2: "critical"}[severity]


def main() -> None:
    if VERBOSE:
        print(f"[serial] opening {SERIAL_PORT} @ {SERIAL_BAUDRATE}")
    while True:
        try:
            with serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=SERIAL_TIMEOUT) as ser:
                if VERBOSE:
                    print("[serial] port opened")
                while True:
                    try:
                        raw = ser.readline()
                        if not raw:
                            # no data within timeout; yield CPU
                            time.sleep(READ_INTERVAL)
                            continue
                        line = raw.decode(errors="ignore").strip()
                        if not line:
                            continue
                        # Try JSON first
                        parsed = parse_json_line(line)
                        if parsed is None:
                            parsed = parse_kv_line(line)
                        if parsed is None:
                            continue
                        temp, ph, turb = parsed
                        alert_level = classify_alert(ph, turb, temp)
                        insert_measurement(ph, turb, temp, alert_level)
                    except Exception as e:
                        if VERBOSE:
                            print(f"[serial] error: {e}")
                        # brief pause to avoid tight error loop
                        time.sleep(READ_INTERVAL)
        except Exception as e:
            # Could not open serial port; wait and retry.
            if VERBOSE:
                print(f"[serial] serial port open failed: {e}")
            time.sleep(2)


if __name__ == "__main__":
    from .db import init_db

    init_db()
    try:
        main()
    except KeyboardInterrupt:
        print("[serial] terminated by user")
        sys.exit(0)