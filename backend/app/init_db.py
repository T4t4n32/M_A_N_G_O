import time
from sqlalchemy import text

from app.extensions import db
from app.models import SensorStation

LOCK_KEY = 734001234567  # bigint


def _wait_for_db(retries=30, delay=1.0):
    for _ in range(retries):
        try:
            db.session.execute(text("SELECT 1"))
            return True
        except Exception:
            time.sleep(delay)
    return False


def init_db(app):
    with app.app_context():
        if not _wait_for_db():
            raise RuntimeError("Database not reachable")

        dialect = db.engine.dialect.name
        locked = False

        try:
            if dialect == "postgresql":
                db.session.execute(text("SELECT pg_advisory_lock(:k)"), {"k": LOCK_KEY})
                locked = True

            db.create_all()

            # Seed estación (idempotente)
            name = app.config.get("DEFAULT_STATION_NAME", "MANGO Station")
            if not SensorStation.query.filter_by(name=name).first():
                db.session.add(SensorStation(name=name))
                db.session.commit()

        finally:
            if locked:
                try:
                    db.session.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": LOCK_KEY})
                    db.session.commit()
                except Exception:
                    pass
