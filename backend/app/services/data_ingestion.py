# app/services/data_ingestion.py

from datetime import datetime

_latest_turbidity = {
    "value": None,
    "unit": "V",
    "timestamp": None
}

def update_turbidity(value: float):
    global _latest_turbidity
    _latest_turbidity = {
        "value": round(value, 3),
        "unit": "V",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

def get_latest_turbidity():
    return _latest_turbidity

