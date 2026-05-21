from datetime import datetime
from app.extensions import db


class DownloadLog(db.Model):
    __tablename__ = "download_logs"

    id            = db.Column(db.Integer, primary_key=True)
    path          = db.Column(db.String(512), nullable=False)
    filename      = db.Column(db.String(256), nullable=False)
    user_id       = db.Column(db.Integer, db.ForeignKey("mango_users.id", ondelete="SET NULL"), nullable=True)
    ip            = db.Column(db.String(64), nullable=True)
    user_agent    = db.Column(db.String(512), nullable=True)
    downloaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id":            self.id,
            "path":          self.path,
            "filename":      self.filename,
            "user_id":       self.user_id,
            "ip":            self.ip,
            "downloaded_at": self.downloaded_at.isoformat() + "Z",
        }
