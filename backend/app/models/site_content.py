from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from app.extensions import db

log = logging.getLogger("mango.models.site_content")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SiteContent(db.Model):
    __tablename__ = "site_content"

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False, default="{}")
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)

    def get_content(self) -> dict:
        try:
            return json.loads(self.content)
        except (TypeError, ValueError):
            log.error("SiteContent id=%s holds invalid JSON — serving empty content", self.id)
            return {}

    def set_content(self, data: dict) -> None:
        self.content = json.dumps(data, ensure_ascii=False)
        self.updated_at = _utcnow()

    def to_dict(self) -> dict:
        ts_ms = int(self.updated_at.timestamp() * 1000) if self.updated_at else None
        return {
            "content": self.get_content(),
            "updatedAt": ts_ms,
        }
