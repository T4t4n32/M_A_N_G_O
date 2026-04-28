from datetime import datetime
from app.database import db

VALID_TYPES = ["image", "video"]


class Media(db.Model):
    __tablename__ = "media"

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(256), nullable=False)
    url = db.Column(db.String(512), nullable=False)
    media_type = db.Column(db.String(16), nullable=False)  # "image" | "video"
    size = db.Column(db.Integer, nullable=False)           # bytes
    mime_type = db.Column(db.String(64), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "filename": self.filename,
            "url": self.url,
            "type": self.media_type,
            "size": self.size,
            "mime_type": self.mime_type,
            "uploaded_at": self.uploaded_at.isoformat() + "Z",
        }
