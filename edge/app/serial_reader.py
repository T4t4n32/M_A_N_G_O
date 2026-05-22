#!/usr/bin/env python3
"""Serial reader: reads JSONL from ESP32 and forwards to local edge API.

Reads from /dev/ttyUSB0 (configurable) and POSTs each JSON line
to http://localhost:9100/ingest.

Expected ESP32 output (one JSON object per line):
  {"type":"sensor_reading","mission_id":"...","station":"...","source":"esp32-sensors",
   "readings":{"ph":7.1,"turbidity_ntu":18.4,"temperature_c":28.6},"timestamp_device":"..."}

  {"type":"imu","mission_id":"...","yaw":34.2,"pitch":1.5,"roll":-2.1,...}

  {"type":"event","mission_id":"...","event_type":"button_press","data":{...}}
"""

import json
import logging
import os
import sys
import time
import urllib.error
import urllib.request

log = logging.getLogger("mango.serial")
logging.basicConfig(
    level=logging.DEBUG if os.environ.get("MANGO_VERBOSE") else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

SERIAL_PORT     = os.environ.get("SERIAL_PORT", "/dev/ttyUSB0")
SERIAL_BAUDRATE = int(os.environ.get("SERIAL_BAUDRATE", "115200"))
EDGE_API_URL    = os.environ.get("EDGE_API_URL", "http://localhost:9100/ingest")
RECONNECT_DELAY = 5


def _post(payload: dict) -> bool:
    body = json.dumps(payload).encode()
    req  = urllib.request.Request(
        EDGE_API_URL,
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception as e:
        log.warning("POST to edge API failed: %s", e)
        return False


def run() -> None:
    try:
        import serial
    except ImportError:
        log.error("pyserial not installed — run: pip3 install pyserial")
        sys.exit(1)

    log.info("Opening serial port %s @ %d baud", SERIAL_PORT, SERIAL_BAUDRATE)

    while True:
        try:
            with serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=2) as ser:
                log.info("Serial port open")
                while True:
                    raw = ser.readline()
                    if not raw:
                        continue
                    line = raw.decode("utf-8", errors="replace").strip()
                    if not line or not line.startswith("{"):
                        continue
                    try:
                        payload = json.loads(line)
                    except json.JSONDecodeError:
                        log.debug("Non-JSON line: %s", line[:80])
                        continue

                    log.debug("RX: %s", line[:120])
                    _post(payload)

        except Exception as e:
            log.error("Serial error: %s — reconnecting in %ds", e, RECONNECT_DELAY)
            time.sleep(RECONNECT_DELAY)


if __name__ == "__main__":
    run()
