import math

REASON = {
    "NOT_A_NUMBER":              "NOT_A_NUMBER",
    "OUT_OF_RANGE_PH":           "OUT_OF_RANGE_PH",
    "OUT_OF_RANGE_TEMP":         "OUT_OF_RANGE_TEMP",
    "OUT_OF_RANGE_NTU":          "OUT_OF_RANGE_NTU",
    "SUSPECT_JUMP_PH":           "SUSPECT_JUMP_PH",
    "RTD_FAULT":                 "RTD_FAULT",
}


def _is_bad_number(x) -> bool:
    return x is None or isinstance(x, bool) or math.isnan(x) or math.isinf(x)


def validate_reading(sensor, value, *, last_valid_value=None, meta=None):
    """
    Returns dict(valid=bool, reason=str|None, quality=str).
    sensor: Sensor ORM object — uses sensor.type (not sensor.key).
    """
    meta = meta or {}
    sensor_type = (getattr(sensor, "type", None) or "").lower()

    if value is None:
        return {"valid": False, "reason": REASON["NOT_A_NUMBER"], "quality": "error"}

    try:
        v = float(value)
    except Exception:
        return {"valid": False, "reason": REASON["NOT_A_NUMBER"], "quality": "error"}

    if _is_bad_number(v):
        return {"valid": False, "reason": REASON["NOT_A_NUMBER"], "quality": "error"}

    if meta.get("fault") is True and sensor_type in ("temp", "temperature"):
        return {"valid": False, "reason": REASON["RTD_FAULT"], "quality": "maintenance"}

    if sensor_type == "ph":
        if v < 0 or v > 14:
            return {"valid": False, "reason": REASON["OUT_OF_RANGE_PH"], "quality": "maintenance"}

    elif sensor_type in ("temp", "temperature"):
        if v < -50 or v > 150:
            return {"valid": False, "reason": REASON["OUT_OF_RANGE_TEMP"], "quality": "maintenance"}

    elif sensor_type == "turbidity":
        if v < 0 or v > 1000:
            return {"valid": False, "reason": REASON["OUT_OF_RANGE_NTU"], "quality": "maintenance"}

    quality = "ok"
    reason = None

    if sensor_type == "ph" and last_valid_value is not None:
        try:
            if abs(v - float(last_valid_value)) > 2.0:
                quality = "warn"
                reason = REASON["SUSPECT_JUMP_PH"]
        except Exception:
            pass

    return {"valid": True, "reason": reason, "quality": quality}
