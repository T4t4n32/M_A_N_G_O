import math

REASON = {
    "NOT_A_NUMBER": "NOT_A_NUMBER",
    "OUT_OF_RANGE_PH": "OUT_OF_RANGE_PH",
    "OUT_OF_RANGE_TEMP": "OUT_OF_RANGE_TEMP",
    "OUT_OF_RANGE_NTU": "OUT_OF_RANGE_NTU",
    "SUSPECT_JUMP_PH": "SUSPECT_JUMP_PH",
    "RTD_FAULT": "RTD_FAULT",
    "KNOWN_SENSOR_ISSUE_AZDM01": "KNOWN_SENSOR_ISSUE_AZDM01",
}

def _is_bad_number(x: float) -> bool:
    return x is None or isinstance(x, bool) or math.isnan(x) or math.isinf(x)

def validate_reading(sensor, value, *, last_valid_value=None, meta=None):
    """
    Retorna:
      dict(valid=bool, reason=str|None, quality=str, calibration_status=str)
    """
    meta = meta or {}

    # 1) Normalización
    if value is None:
        return {"valid": False, "reason": REASON["NOT_A_NUMBER"], "quality": "error"}

    try:
        v = float(value)
    except Exception:
        return {"valid": False, "reason": REASON["NOT_A_NUMBER"], "quality": "error"}

    if _is_bad_number(v):
        return {"valid": False, "reason": REASON["NOT_A_NUMBER"], "quality": "error"}

    # 2) Mantenimiento forzado (si lo activas)
    if getattr(sensor, "maintenance_mode", False):
        return {"valid": False, "reason": "MAINTENANCE_MODE", "quality": "maintenance"}

    # 3) Fallos eléctricos (ej: MAX31865)
    # Si en el futuro recibes meta={"fault": true} desde Jetson/ESP32, aquí lo marcas.
    if sensor.key == "temperature" and meta.get("fault") is True:
        return {"valid": False, "reason": REASON["RTD_FAULT"], "quality": "maintenance"}

    # 4) Validación dura por rango
    if sensor.key == "ph":
        if v < 0 or v > 14:
            return {"valid": False, "reason": REASON["OUT_OF_RANGE_PH"], "quality": "maintenance"}

    elif sensor.key == "temperature":
        if v < -50 or v > 150:
            return {"valid": False, "reason": REASON["OUT_OF_RANGE_TEMP"], "quality": "maintenance"}

    elif sensor.key == "turbidity":
        if v < 0 or v > 1000:
            # si aún estás en AZDM01 y sabes que falla, lo dejamos explícito
            if (sensor.model or "").upper() == "AZDM01":
                return {"valid": False, "reason": REASON["KNOWN_SENSOR_ISSUE_AZDM01"], "quality": "maintenance"}
            return {"valid": False, "reason": REASON["OUT_OF_RANGE_NTU"], "quality": "maintenance"}

    # 5) Validación contextual (NO invalida, solo warn)
    quality = "ok"
    reason = None

    # pH sin calibración
    if sensor.key == "ph" and (sensor.calibration_status or "unknown") != "calibrated":
        quality = "warn"

    # salto sospechoso de pH (ej: > 2.0 entre lecturas)
    if sensor.key == "ph" and last_valid_value is not None:
        try:
            if abs(v - float(last_valid_value)) > 2.0:
                quality = "warn"
                reason = REASON["SUSPECT_JUMP_PH"]
        except Exception:
            pass

    return {"valid": True, "reason": reason, "quality": quality}
