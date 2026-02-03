import datetime
import enum
from sqlalchemy import Float, DateTime, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from mango_api.db.base import Base


class MeasurementType(str, enum.Enum):
    ph = "ph"
    temperature_c = "temperature_c"
    turbidity_ntu = "turbidity_ntu"


class Measurement(Base):
    __tablename__ = "measurements"
    __table_args__ = (
        UniqueConstraint("sensor_id", "timestamp", "measurement_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    sensor_id: Mapped[int] = mapped_column(ForeignKey("sensors.id"))
    measurement_type: Mapped[MeasurementType] = mapped_column(Enum(MeasurementType))
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.datetime.utcnow
    )

    sensor = relationship("Sensor", back_populates="measurements")
