from datetime import datetime
from app.database import db

ALLOWED_EXTENSIONS = {"pdf", "md", "txt", "doc", "docx"}


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(256), nullable=False)
    url = db.Column(db.String(512), nullable=False)
    size = db.Column(db.Integer, nullable=False)  # bytes
    mime_type = db.Column(db.String(64), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "filename": self.filename,
            "url": self.url,
            "size": self.size,
            "mime_type": self.mime_type,
            "uploaded_at": self.uploaded_at.isoformat() + "Z",
        }
