import os
import time
from sqlalchemy import text

from app import create_app
from app.extensions import db


ADVISORY_LOCK_KEY = 424242  # cualquier entero fijo


def wait_for_db(max_wait_s: int = 60):
    deadline = time.time() + max_wait_s
    last_err = None
    while time.time() < deadline:
        try:
            with db.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception as e:
            last_err = e
            time.sleep(1)
    raise RuntimeError(f"DB not ready after {max_wait_s}s. Last error: {last_err}")


def main():
    app = create_app()

    with app.app_context():
        # asegura que los modelos se registren en metadata
        import app.models  # noqa: F401

        wait_for_db(max_wait_s=int(os.getenv("DB_WAIT_S", "60")))

        # lock para evitar concurrencia si algo raro reintenta
        with db.engine.begin() as conn:
            conn.execute(text("SELECT pg_advisory_lock(:k)"), {"k": ADVISORY_LOCK_KEY})
            try:
                db.create_all()
            finally:
                conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": ADVISORY_LOCK_KEY})


if __name__ == "__main__":
    main()
