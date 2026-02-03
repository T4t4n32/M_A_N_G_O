import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from mango_api.api.deps import get_db, get_current_user
from mango_api.models import Sensor, User, UserRole


router = APIRouter(prefix="/sensors", tags=["sensors"])


@router.get("/status")
def sensor_status(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Sensor)
    if user.role != UserRole.admin:
        query = query.filter(Sensor.institution_id == user.institution_id)

    now = datetime.datetime.utcnow()
    payload = []
    for sensor in query.all():
        last_seen = sensor.last_seen_at
        status = "offline"
        if last_seen and (now - last_seen).total_seconds() < 3600:
            status = "online"
        payload.append(
            {
                "sensor_id": sensor.sensor_id,
                "name": sensor.name,
                "sensor_type": sensor.sensor_type,
                "last_seen_at": last_seen,
                "status": status,
            }
        )
    return payload
