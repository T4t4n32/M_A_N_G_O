#!/usr/bin/env python3
"""
One-time schema migration: add `username` column to mango_users.

Run inside the backend container:
  docker exec -it mango_backend python /app/scripts/migrate_username.py

SQLAlchemy's create_all() does not ALTER existing tables, so this script
issues raw DDL directly against the PostgreSQL connection.
"""

from __future__ import annotations

import sys

sys.path.insert(0, "/app")

from sqlalchemy import text  # noqa: E402

from app import create_app   # noqa: E402
from app.extensions import db  # noqa: E402

app = create_app()

DDL_STEPS = [
    # Add column — idempotent via IF NOT EXISTS (PostgreSQL 9.6+)
    "ALTER TABLE mango_users ADD COLUMN IF NOT EXISTS username VARCHAR(64)",
    # Unique index — idempotent
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_mango_users_username ON mango_users (username)",
]


def run() -> None:
    with app.app_context():
        conn = db.engine.connect()
        try:
            for ddl in DDL_STEPS:
                print(f"  SQL: {ddl}")
                conn.execute(text(ddl))
            conn.commit()
            print("Migration complete: username column ready.")
        except Exception as exc:
            conn.rollback()
            print(f"ERROR: {exc}")
            raise
        finally:
            conn.close()


if __name__ == "__main__":
    run()
