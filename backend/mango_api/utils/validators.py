import datetime
from mango_api.models.measurement import MeasurementType


RANGE_LIMITS = {
    MeasurementType.ph: (0.0, 14.0),
    MeasurementType.temperature_c: (-50.0, 250.0),
    MeasurementType.turbidity_ntu: (0.0, 4000.0),
}


def validate_timestamp(timestamp: datetime.datetime) -> None:
    if timestamp.tzinfo is None:
        raise ValueError("timestamp must include timezone information")


def validate_value_range(measurement_type: MeasurementType, value: float) -> None:
    min_val, max_val = RANGE_LIMITS[measurement_type]
    if not (min_val <= value <= max_val):
        raise ValueError(
            f"{measurement_type.value} value out of range ({min_val} - {max_val})"
        )
