from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
import datetime

from mango_api.db.base import Base


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    domain: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.datetime.utcnow
    )

    users = relationship("User", back_populates="institution")
    sensors = relationship("Sensor", back_populates="institution")
