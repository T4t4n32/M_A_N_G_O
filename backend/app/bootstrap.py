# backend/app/bootstrap.py
import time
from sqlalchemy import text

from app import create_app
from app.extensions import db


def main():
    app = create_app()

    with app.app_context():
        # Espera DB lista (reintentos)
        for i in range(30):
            try:
                db.session.execute(text("SELECT 1"))
                break
            except Exception:
                time.sleep(1)
        else:
            raise RuntimeError("DB not ready after retries")

        db.create_all()


if __name__ == "__main__":
    main()
