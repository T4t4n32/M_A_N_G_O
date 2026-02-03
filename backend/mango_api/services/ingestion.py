import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from mango_api.models import Sensor, Measurement, SensorType, MeasurementType
from mango_api.schemas.measurement import MeasurementIngest
from mango_api.utils.validators import validate_timestamp, validate_value_range


class IngestionService:
    @staticmethod
    def ingest_measurement(
        db: Session, payload: MeasurementIngest
    ) -> Measurement:
        sensor = db.query(Sensor).filter(Sensor.sensor_id == payload.sensor_id).first()
        if not sensor or not sensor.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sensor not found or inactive",
            )

        expected_type = {
            SensorType.ph: MeasurementType.ph,
            SensorType.pt100: MeasurementType.temperature_c,
            SensorType.turbidity: MeasurementType.turbidity_ntu,
        }[sensor.sensor_type]
        if payload.measurement_type != expected_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Measurement type does not match sensor type",
            )

        # Security/data-quality: require timezone-aware timestamps and enforce physical limits.
        validate_timestamp(payload.timestamp)
        validate_value_range(payload.measurement_type, payload.value)

        measurement = Measurement(
            sensor_id=sensor.id,
            measurement_type=payload.measurement_type,
            value=payload.value,
            unit=payload.unit,
            timestamp=payload.timestamp,
        )

        db.add(measurement)
        sensor.last_seen_at = datetime.datetime.utcnow()

        try:
            db.commit()
        except IntegrityError as exc:
            # Security/data-integrity: prevent duplicate records for the same sensor/time/type.
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate measurement",
            ) from exc

        db.refresh(measurement)
        return measurement
