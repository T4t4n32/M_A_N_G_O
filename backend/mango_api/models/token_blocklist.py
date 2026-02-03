import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from mango_api.db.base import Base


class TokenBlocklist(Base):
    __tablename__ = "token_blocklist"

    id: Mapped[int] = mapped_column(primary_key=True)
    jti: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    token_type: Mapped[str] = mapped_column(String(20), nullable=False)
    expires_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.datetime.utcnow
    )
