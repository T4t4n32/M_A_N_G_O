import os
import time
import sys
from sqlalchemy import text

from app import create_app
from app.extensions import db


LOCK_KEY = 88442211  # cualquier entero fijo, pero constante


def wait_for_db(max_wait_s: int = 90) -> None:
    """
    Espera a que la DB responda, haciendo SELECT 1.
    """
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


def create_tables() -> None:
    """
    Crea tablas de forma segura (idempotente).
    En Postgres aplica advisory lock; en otros motores no.
    """
    engine = db.engine
    dialect = engine.dialect.name  # "postgresql", "sqlite", etc.

    if dialect == "postgresql":
        with engine.begin() as conn:
            conn.execute(text("SELECT pg_advisory_lock(:k)"), {"k": LOCK_KEY})
            try:
                db.Model.metadata.create_all(bind=conn)
            finally:
                conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": LOCK_KEY})
    else:
        # SQLite / otros: create_all ya es idempotente
        db.create_all()


def main() -> int:
    app = create_app()

    with app.app_context():
        # Load all model modules so SQLAlchemy registers their tables in
        # metadata before create_all() runs.
        import app.models             # noqa: F401 — core models
        try:
            import app.models_compat  # noqa: F401 — mango_compat_stations, mango_compat_readings
        except ImportError:
            pass
        try:
            from app.models.media import Media          # noqa: F401
            from app.models.document import Document    # noqa: F401
            from app.models.content import EditableContent  # noqa: F401
        except ImportError:
            pass

        max_wait = int(os.getenv("DB_WAIT_S", "90"))
        print(f"[db_init] Waiting for DB up to {max_wait}s...")
        wait_for_db(max_wait_s=max_wait)

        print("[db_init] Creating tables (if missing)...")
        create_tables()

        print("[db_init] Done ✅")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(f"[db_init] Failed ❌: {e}", file=sys.stderr)
        raise