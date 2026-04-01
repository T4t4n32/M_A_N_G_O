# -*- coding: utf-8 -*-
import time
import random
from db import init_db, enqueue_measurement
from config import READ_INTERVAL_SEC

def read_sensors():
    # TODO: reemplazar con tus lecturas reales
    # pH, turbidez, temperatura
    return {
        "ph": round(7.0 + random.uniform(-0.6, 0.6), 2),
        "turbidity": round(12.0 + random.uniform(-5.0, 20.0), 2),
        "temperature": round(27.0 + random.uniform(-3.0, 4.0), 2)
    }

def classify_alert(data):
    if data["ph"] < 6.3 or data["ph"] > 8.5:
        return "critical"
    if data["turbidity"] > 25:
        return "warning"
    if data["temperature"] > 31:
        return "warning"
    return "normal"

def main():
    init_db()
    while True:
        data = read_sensors()
        alert = classify_alert(data)
        seq, measured_at = enqueue_measurement(data, alert)
        print("saved seq={} at={} alert={}".format(seq, measured_at, alert))
        time.sleep(READ_INTERVAL_SEC)

if __name__ == "__main__":
    main()