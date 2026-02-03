from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from mango_api.api.deps import get_db, require_roles
from mango_api.core.security import hash_password
from mango_api.models import Institution, Sensor, User, UserRole
from mango_api.schemas.user import UserCreate, UserResponse
from mango_api.schemas.sensor import SensorCreate, SensorResponse
from mango_api.schemas.institution import InstitutionCreate, InstitutionResponse


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/institutions", response_model=InstitutionResponse)
def create_institution(
    payload: InstitutionCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles(UserRole.admin)),
):
    if db.query(Institution).filter(Institution.name == payload.name).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Institution exists"
        )

    institution = Institution(name=payload.name, domain=payload.domain)
    db.add(institution)
    db.commit()
    db.refresh(institution)
    return institution


@router.post("/users", response_model=UserResponse)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles(UserRole.admin)),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User exists")

    if payload.institution_id:
        institution = db.get(Institution, payload.institution_id)
        if not institution:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        institution_id=payload.institution_id,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/sensors", response_model=SensorResponse)
def create_sensor(
    payload: SensorCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles(UserRole.admin)),
):
    if db.query(Sensor).filter(Sensor.sensor_id == payload.sensor_id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sensor exists")

    institution = db.get(Institution, payload.institution_id)
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    sensor = Sensor(
        sensor_id=payload.sensor_id,
        name=payload.name,
        sensor_type=payload.sensor_type,
        institution_id=payload.institution_id,
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor
