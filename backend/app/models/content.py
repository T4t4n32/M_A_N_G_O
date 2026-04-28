from datetime import datetime
from app.database import db

# Initial editable content keys loaded at seed time.
DEFAULT_CONTENT = {
    "hero.title": "M.A.N.G.O.",
    "hero.subtitle": "Autonomous Monitoring of Oceanic Management Levels",
    "about.intro": "M.A.N.G.O. is an open research project for real-time ocean monitoring.",
    "project.summary": "We deploy autonomous sensors to track pH, temperature, and turbidity.",
}


class EditableContent(db.Model):
    __tablename__ = "editable_content"

    key = db.Column(db.String(128), primary_key=True)
    value = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "value": self.value,
            "updated_at": self.updated_at.isoformat() + "Z",
        }
