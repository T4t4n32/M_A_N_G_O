from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from mango_api.api.deps import get_db, require_roles
from mango_api.models import UserRole
from mango_api.schemas.measurement import MeasurementIngest, MeasurementResponse
from mango_api.services.ingestion import IngestionService


router = APIRouter(prefix="/ingestion", tags=["ingestion"])


@router.post("/measurements", response_model=MeasurementResponse)
def ingest_measurement(
    payload: MeasurementIngest,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(UserRole.admin, UserRole.institution)),
):
    measurement = IngestionService.ingest_measurement(db, payload)
    return measurement
