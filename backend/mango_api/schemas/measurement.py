import datetime
from pydantic import BaseModel, Field
from mango_api.models.measurement import MeasurementType


class MeasurementIngest(BaseModel):
    sensor_id: str = Field(..., description="Provisioned sensor identifier")
    measurement_type: MeasurementType
    value: float
    unit: str
    timestamp: datetime.datetime


class MeasurementResponse(BaseModel):
    id: int
    sensor_id: int
    measurement_type: MeasurementType
    value: float
    unit: str
    timestamp: datetime.datetime
    received_at: datetime.datetime

    class Config:
        from_attributes = True
