from pydantic import BaseModel
from mango_api.models.sensor import SensorType


class SensorCreate(BaseModel):
    sensor_id: str
    name: str
    sensor_type: SensorType
    institution_id: int


class SensorResponse(BaseModel):
    id: int
    sensor_id: str
    name: str
    sensor_type: SensorType
    institution_id: int
    is_active: bool

    class Config:
        from_attributes = True
