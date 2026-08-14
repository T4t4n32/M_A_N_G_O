from __future__ import annotations
from datetime import datetime, timezone
from app.extensions import db


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UploadedFile(db.Model):
    __tablename__ = "uploaded_files"

    id            = db.Column(db.Integer,     primary_key=True)
    stored_name   = db.Column(db.String(256), nullable=False, unique=True)
    original_name = db.Column(db.String(256), nullable=False)
    url           = db.Column(db.String(512), nullable=False)
    kind          = db.Column(db.String(16),  nullable=False)  # image | video | document
    title         = db.Column(db.String(256), nullable=False,  default="")
    description   = db.Column(db.Text,        nullable=True)
    category      = db.Column(db.String(64),  nullable=True)
    subcategory   = db.Column(db.String(64),  nullable=True)
    size          = db.Column(db.Integer,     nullable=False)
    mime_type     = db.Column(db.String(64),  nullable=True)
    uploaded_at   = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id":            self.id,
            "stored_name":   self.stored_name,
            "original_name": self.original_name,
            "url":           self.url,
            "kind":          self.kind,
            "title":         self.title,
            "description":   self.description,
            "category":      self.category,
            "subcategory":   self.subcategory,
            "size":          self.size,
            "mime_type":     self.mime_type,
            "uploaded_at":   self.uploaded_at.isoformat() if self.uploaded_at else None,
        }
