"""Local SQLite storage for M.A.N.G.O. node.

This module implements a simple outbox pattern using SQLite.  All
measurements are inserted into the ``measurements`` table whether
the node can currently reach the backend or not.  The sync
manager selects rows where ``sent=0``, sends them to the backend
and then marks them as sent.  If the POST request fails the
attempt count is incremented and the error text recorded.

SQLite is chosen because it is included in Python's standard
library and is suitable for embedded devices like the Jetson TK1.
It is configured with Write-Ahead Logging (WAL) mode and a busy
timeout to reduce the likelihood of lock contention when the
acquire and sync processes access the database concurrently.
"""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Iterable, List, Tuple

from .config import DB_PATH, VERBOSE


def _ensure_directory(path: str) -> None:
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection with appropriate PRAGMAs."""
    con = sqlite3.connect(DB_PATH, timeout=5)
    # Use WAL mode for better concurrency between readers and writers.
    con.execute("PRAGMA journal_mode=WAL;")
    con.execute("PRAGMA synchronous=NORMAL;")
    # Enable row factory so SELECT rows behave like dicts.
    con.row_factory = sqlite3.Row
    return con


def init_db() -> None:
    """Initialise database schema if it does not already exist."""
    _ensure_directory(DB_PATH)
    con = get_connection()
    cur = con.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            measured_at TEXT NOT NULL,
            ph REAL,
            turbidity REAL,
            temperature REAL,
            alert_level TEXT NOT NULL DEFAULT 'normal',
            sent INTEGER NOT NULL DEFAULT 0,
            sent_at TEXT,
            retry_count INTEGER NOT NULL DEFAULT 0,
            last_error TEXT
        );
        """
    )
    cur.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_measurements_sent
        ON measurements(sent, id);
        """
    )
    con.commit()
    con.close()


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def insert_measurement(ph: float | None, turbidity: float | None, temperature: float | None, alert_level: str) -> int:
    """Insert a new measurement row and return its row ID.

    Values may be None to indicate missing readings.  The
    ``measured_at`` timestamp is recorded in UTC.
    """
    con = get_connection()
    cur = con.cursor()
    cur.execute(
        """
        INSERT INTO measurements(
            measured_at, ph, turbidity, temperature, alert_level, sent
        ) VALUES(?, ?, ?, ?, ?, 0)
        """,
        (_utc_now_iso(), ph, turbidity, temperature, alert_level),
    )
    row_id = cur.lastrowid
    con.commit()
    con.close()
    if VERBOSE:
        print(f"[db] inserted measurement id={row_id} ph={ph} turb={turbidity} temp={temperature} alert={alert_level}")
    return row_id


def fetch_unsent(limit: int) -> List[sqlite3.Row]:
    """Return up to ``limit`` unsent rows from the measurements table.

    Rows are ordered by ascending ID so that older measurements are
    flushed first.  The return value is a list of sqlite3.Row
    objects (dict-like).
    """
    con = get_connection()
    cur = con.cursor()
    rows = cur.execute(
        "SELECT id, measured_at, ph, turbidity, temperature, alert_level FROM measurements WHERE sent=0 ORDER BY id ASC LIMIT ?",
        (limit,),
    ).fetchall()
    con.close()
    return list(rows)


def mark_sent(row_ids: Iterable[int]) -> None:
    """Mark the given row IDs as sent and record the send timestamp."""
    ids = list(row_ids)
    if not ids:
        return
    con = get_connection()
    now = _utc_now_iso()
    # Use a parameterised query with executemany for efficiency.
    con.executemany(
        "UPDATE measurements SET sent=1, sent_at=?, last_error=NULL WHERE id=?",
        [(now, rid) for rid in ids],
    )
    con.commit()
    con.close()
    if VERBOSE:
        print(f"[db] marked {len(ids)} rows as sent")


def mark_failed(row_ids: Iterable[int], error: str) -> None:
    """Increment retry count and record error text for the given rows."""
    ids = list(row_ids)
    if not ids:
        return
    con = get_connection()
    con.executemany(
        "UPDATE measurements SET retry_count = retry_count + 1, last_error = ? WHERE id = ?",
        [(error[:500], rid) for rid in ids],
    )
    con.commit()
    con.close()
    if VERBOSE:
        print(f"[db] marked {len(ids)} rows as failed error={error}")