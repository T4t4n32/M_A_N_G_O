import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from mango_api.api.deps import get_db, get_current_user
from mango_api.models import Measurement, Sensor, User, UserRole
from mango_api.schemas.measurement import MeasurementResponse
from mango_api.schemas.sensor import SensorResponse


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/measurements", response_model=list[MeasurementResponse])
def list_measurements(
    sensor_id: str | None = Query(default=None, description="Sensor identifier"),
    start: datetime.datetime | None = None,
    end: datetime.datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Measurement).join(Sensor)

    if sensor_id:
        query = query.filter(Sensor.sensor_id == sensor_id)

    if start:
        query = query.filter(Measurement.timestamp >= start)
    if end:
        query = query.filter(Measurement.timestamp <= end)

    if user.role != UserRole.admin:
        query = query.filter(Sensor.institution_id == user.institution_id)

    return query.order_by(Measurement.timestamp.desc()).limit(500).all()


@router.get("/sensors", response_model=list[SensorResponse])
def list_sensors(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Sensor)
    if user.role != UserRole.admin:
        query = query.filter(Sensor.institution_id == user.institution_id)
    return query.order_by(Sensor.name.asc()).all()
