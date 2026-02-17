class ValidationError(ValueError):
    pass


def _as_str(x, field):
    if x is None:
        raise ValidationError(f"Missing field: {field}")
    x = str(x).strip()
    if not x:
        raise ValidationError(f"Empty field: {field}")
    return x


def _as_float(x, field):
    try:
        return float(x)
    except Exception as e:
        raise ValidationError(f"Invalid number for {field}: {x}") from e


def normalize_ingest_payload(payload):
    if not isinstance(payload, dict):
        raise ValidationError("Payload must be a JSON object")

    station_name = None
    if "station" in payload:
        st = payload["station"]
        if isinstance(st, dict):
            station_name = st.get("name")
        else:
            station_name = st

    station_name = station_name or payload.get("station_name") or "MANGO Station"
    station_name = _as_str(station_name, "station.name")

    readings = payload.get("readings")
    if readings is None:
        reading = payload.get("reading") or payload
        readings = [reading]

    if not isinstance(readings, list) or not readings:
        raise ValidationError("readings must be a non-empty list")

    out = []
    for i, r in enumerate(readings):
        if not isinstance(r, dict):
            raise ValidationError(f"readings[{i}] must be an object")

        rtype = _as_str(r.get("type"), f"readings[{i}].type")
        value = _as_float(r.get("value"), f"readings[{i}].value")
        unit = r.get("unit")
        label = r.get("label") or ""
        ts = r.get("ts")  # opcional

        out.append({"type": rtype, "value": value, "unit": unit, "label": label, "ts": ts})

    return station_name, out
