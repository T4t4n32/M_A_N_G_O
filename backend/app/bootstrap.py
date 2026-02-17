# backend/app/bootstrap.py
from __future__ import annotations

import time
from flask import Flask

from app.extensions import db
from app.models.sensor import SensorStation  # ensures model is registered


def bootstrap(app: Flask) -> None:
    """
    - Espera DB
    - Crea tablas (idempotente)
    - Crea estación default si no existe
    """
    with app.app_context():
        # wait for DB
        for _ in range(30):
            try:
                db.session.execute(db.text("SELECT 1"))
                break
            except Exception:
                time.sleep(1)

        db.create_all()

        name = "MANGO Station"
        st = SensorStation.query.filter_by(name=name).first()
        if not st:
            db.session.add(SensorStation(name=name))
            db.session.commit()
