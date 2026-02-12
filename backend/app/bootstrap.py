# backend/app/bootstrap.py
import os
from sqlalchemy import text

from app.extensions import db

LOCK_KEY = 88442211  # número fijo para el lock (puede ser cualquiera, pero constante)


def bootstrap_db(app) -> None:
    with app.app_context():
        # IMPORTANTÍSIMO: carga modelos para poblar metadata
        import app.models  # noqa: F401

        engine = db.engine

        # Tomamos un lock a nivel DB (sesión) para evitar dobles create
        with engine.connect() as conn:
            conn.execute(text("SELECT pg_advisory_lock(:k)"), {"k": LOCK_KEY})
            try:
                # Crea tablas si faltan (idempotente)
                db.Model.metadata.create_all(bind=conn)

                # Seed mínimo: estación por defecto (sin reventar si ya existe)
                station_name = os.getenv("STATION_NAME", "MANGO Station")
                conn.execute(
                    text(
                        """
                        INSERT INTO sensor_stations (name, created_at)
                        VALUES (:name, NOW())
                        ON CONFLICT (name) DO NOTHING
                        """
                    ),
                    {"name": station_name},
                )
                conn.commit()
            finally:
                conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": LOCK_KEY})
