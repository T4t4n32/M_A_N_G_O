# app/services/sensor_store.py

from threading import Lock
from datetime import datetime

_lock = Lock()

_latest = {
    "ph": None,
    "temperature": None,
    "turbidity": None
}

def update(sensor_name: str, data: dict):
    with _lock:
        data["received_at"] = datetime.utcnow().isoformat()
        _latest[sensor_name] = data

def get_latest(sensor_name: str):
    with _lock:
        return _latest.get(sensor_name)
