from datetime import datetime
from app.database import db

# Valid roles — ordered from least to most privileged.
VALID_ROLES = [
    "visitante",
    "usuario_basico",
    "documental_premium",
    "dataline_low",
    "dataline_high",
    "institucional",
    "admin",
]

# Valid plans
VALID_PLANS = [
    "Publico",
    "Registrado Basico",
    "Documental Premium",
    "DataLine Low",
    "DataLine High",
    "Institucional/Empresarial",
    "Administrativo Interno",
]


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    demo_id = db.Column(db.Integer, unique=True, nullable=True)  # 1001-1070 from demo sheet
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(32), nullable=False, default="visitante")
    plan = db.Column(db.String(64), nullable=True)
    status = db.Column(db.String(16), nullable=False, default="Activo")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "demo_id": self.demo_id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "plan": self.plan,
            "status": self.status,
            "created_at": self.created_at.isoformat() + "Z",
        }

    def __repr__(self) -> str:
        return f"<User {self.username} role={self.role}>"
