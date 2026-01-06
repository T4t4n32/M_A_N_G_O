# app/services/serial_manager.py

import serial
import json
import threading
import time
from app.services.sensor_store import update

SERIAL_PORT = "/dev/ttyACM0"
BAUDRATE = 9600

_serial_thread_started = False

def _serial_loop():
    while True:
        try:
            with serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1) as ser:
                print(f"[SERIAL] Connected to {SERIAL_PORT}")

                while True:
                    line = ser.readline().decode("utf-8", errors="ignore").strip()
                    if not line:
                        continue

                    try:
                        payload = json.loads(line)
                        sensor = payload.get("sensor")

                        if sensor in ["ph", "temperature", "turbidity"]:
                            update(sensor, payload)

                    except json.JSONDecodeError:
                        # ignoramos basura
                        continue

        except Exception as e:
            print(f"[SERIAL] Error: {e}")
            time.sleep(2)

def start_serial_thread():
    global _serial_thread_started

    if _serial_thread_started:
        return

    thread = threading.Thread(target=_serial_loop, daemon=True)
    thread.start()
    _serial_thread_started = True
