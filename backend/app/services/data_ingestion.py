import serial
from datetime import datetime
from app.routes.ph import LATEST_PH

SERIAL_PORT = "/dev/ttyACM0"  # cambia si es necesario
BAUDRATE = 9600

def read_ph_from_serial():
    try:
        ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1)
    except Exception as e:
        print("Serial error:", e)
        return

    print("Serial listener started for pH")

    while True:
        try:
            line = ser.readline().decode("utf-8").strip()
            if "Voltage" in line:
                voltage = float(line.split(":")[-1])
                LATEST_PH["raw_voltage"] = voltage
                LATEST_PH["timestamp"] = datetime.utcnow().isoformat()
        except Exception:
            pass
