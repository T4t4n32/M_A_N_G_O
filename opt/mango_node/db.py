"""Local SQLite storage for M.A.N.G.O. node — store-and-forward outbox.

Implements the outbox pattern: every measurement is written locally first,
then the sync_manager flushes pending rows to the VPS backend.

Packet lifecycle states:
  queued      — row inserted, waiting to be sent
  sending     — picked up by sync_manager (in-memory only, not persisted)
  sent        — VPS confirmed receipt
  failed_retry — transient failure, will be retried
  failed_final — exceeded max retries, needs manual review

SQLite is used because it is in Python's stdlib and is suitable for
embedded devices like the Jetson TK1. WAL mode reduces lock contention
between the acquire and sync processes.
"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from typing import Iterable, List, Optional

from .config import DB_PATH, VERBOSE


def _ensure_directory(path: str) -> None:
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, timeout=5)
    con.execute("PRAGMA journal_mode=WAL;")
    con.execute("PRAGMA synchronous=NORMAL;")
    con.row_factory = sqlite3.Row
    return con


def init_db() -> None:
    """Initialise schema, adding columns that did not exist in older versions."""
    _ensure_directory(DB_PATH)
    con = get_connection()
    cur = con.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS measurements (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            measured_at   TEXT NOT NULL,
            ph            REAL,
            turbidity     REAL,
            temperature   REAL,
            alert_level   TEXT NOT NULL DEFAULT 'normal',
            sent          INTEGER NOT NULL DEFAULT 0,
            sent_at       TEXT,
            retry_count   INTEGER NOT NULL DEFAULT 0,
            last_error    TEXT,
            sms_sent      INTEGER NOT NULL DEFAULT 0,
            packet_id     TEXT,
            device_id     TEXT,
            seq           INTEGER,
            status        TEXT NOT NULL DEFAULT 'queued'
        );
        """
    )

    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_measurements_sent ON measurements(sent, id);"
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS idx_measurements_alert ON measurements(alert_level, sms_sent, id);"
    )
    cur.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_measurements_packet_id ON measurements(packet_id) "
        "WHERE packet_id IS NOT NULL;"
    )

    # Additive migrations for existing databases
    _add_column_if_missing(cur, "measurements", "sms_sent",   "INTEGER NOT NULL DEFAULT 0")
    _add_column_if_missing(cur, "measurements", "packet_id",  "TEXT")
    _add_column_if_missing(cur, "measurements", "device_id",  "TEXT")
    _add_column_if_missing(cur, "measurements", "seq",        "INTEGER")
    _add_column_if_missing(cur, "measurements", "status",     "TEXT NOT NULL DEFAULT 'queued'")

    con.commit()
    con.close()


def _add_column_if_missing(cur: sqlite3.Cursor, table: str, column: str, definition: str) -> None:
    try:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
    except Exception:
        pass  # column already exists


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def insert_measurement(
    ph: float | None,
    turbidity: float | None,
    temperature: float | None,
    alert_level: str,
    packet_id: str | None = None,
    device_id: str | None = None,
    seq: int | None = None,
) -> int:
    """Insert a new measurement row and return its row ID.

    Skips insertion if packet_id already exists (deduplication).
    """
    con = get_connection()
    cur = con.cursor()

    if packet_id:
        existing = cur.execute(
            "SELECT id FROM measurements WHERE packet_id = ?", (packet_id,)
        ).fetchone()
        if existing:
            con.close()
            if VERBOSE:
                print(f"[db] duplicate packet_id={packet_id}, skipping")
            return existing[0]

    cur.execute(
        """
        INSERT INTO measurements(
            measured_at, ph, turbidity, temperature, alert_level,
            sent, packet_id, device_id, seq, status
        ) VALUES(?, ?, ?, ?, ?, 0, ?, ?, ?, 'queued')
        """,
        (_utc_now_iso(), ph, turbidity, temperature, alert_level,
         packet_id, device_id, seq),
    )
    row_id = cur.lastrowid
    con.commit()
    con.close()

    if VERBOSE:
        print(
            f"[db] inserted id={row_id} ph={ph} turb={turbidity} "
            f"temp={temperature} alert={alert_level} pkt={packet_id}"
        )
    return row_id


def fetch_unsent(limit: int) -> List[sqlite3.Row]:
    """Return up to ``limit`` unsent rows ordered by ascending ID (oldest first)."""
    con = get_connection()
    cur = con.cursor()
    rows = cur.execute(
        """
        SELECT id, measured_at, ph, turbidity, temperature,
               alert_level, packet_id, device_id, seq
        FROM measurements
        WHERE sent = 0
        ORDER BY id ASC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    con.close()
    return list(rows)


def mark_sent(row_ids: Iterable[int]) -> None:
    ids = list(row_ids)
    if not ids:
        return
    con = get_connection()
    now = _utc_now_iso()
    con.executemany(
        "UPDATE measurements SET sent=1, sent_at=?, last_error=NULL, status='sent' WHERE id=?",
        [(now, rid) for rid in ids],
    )
    con.commit()
    con.close()
    if VERBOSE:
        print(f"[db] marked {len(ids)} rows as sent")


def mark_failed(row_ids: Iterable[int], error: str) -> None:
    ids = list(row_ids)
    if not ids:
        return
    con = get_connection()
    con.executemany(
        """
        UPDATE measurements
        SET retry_count = retry_count + 1,
            last_error = ?,
            status = CASE
                WHEN retry_count + 1 >= 10 THEN 'failed_final'
                ELSE 'failed_retry'
            END
        WHERE id = ?
        """,
        [(error[:500], rid) for rid in ids],
    )
    con.commit()
    con.close()
    if VERBOSE:
        print(f"[db] marked {len(ids)} rows as failed: {error[:80]}")


def fetch_unsent_alerts(limit: int) -> List[sqlite3.Row]:
    """Return non-normal measurements not yet SMS-notified."""
    con = get_connection()
    cur = con.cursor()
    rows = cur.execute(
        """
        SELECT id, measured_at, ph, turbidity, temperature, alert_level
        FROM measurements
        WHERE alert_level != 'normal' AND sms_sent = 0
        ORDER BY id ASC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    con.close()
    return list(rows)


def fetch_latest_readings() -> Optional[sqlite3.Row]:
    """Return the most recent measurement row, or None if the table is empty."""
    con = get_connection()
    cur = con.cursor()
    row = cur.execute(
        "SELECT measured_at, ph, turbidity, temperature, alert_level FROM measurements ORDER BY id DESC LIMIT 1"
    ).fetchone()
    con.close()
    return row


def get_queue_stats() -> dict:
    """Return counts of rows in each status for the local API."""
    con = get_connection()
    cur = con.cursor()
    total        = cur.execute("SELECT COUNT(*) FROM measurements").fetchone()[0]
    queued       = cur.execute("SELECT COUNT(*) FROM measurements WHERE sent=0").fetchone()[0]
    sent         = cur.execute("SELECT COUNT(*) FROM measurements WHERE sent=1").fetchone()[0]
    failed_retry = cur.execute(
        "SELECT COUNT(*) FROM measurements WHERE status='failed_retry'"
    ).fetchone()[0]
    failed_final = cur.execute(
        "SELECT COUNT(*) FROM measurements WHERE status='failed_final'"
    ).fetchone()[0]
    unsent_alerts = cur.execute(
        "SELECT COUNT(*) FROM measurements WHERE alert_level != 'normal' AND sms_sent=0"
    ).fetchone()[0]
    con.close()
    return {
        "total": total,
        "queued": queued,
        "sent": sent,
        "failed_retry": failed_retry,
        "failed_final": failed_final,
        "unsent_alerts_sms": unsent_alerts,
    }


def mark_sms_sent(row_id: int) -> None:
    con = get_connection()
    con.execute("UPDATE measurements SET sms_sent = 1 WHERE id = ?", (row_id,))
    con.commit()
    con.close()
    if VERBOSE:
        print(f"[db] marked row id={row_id} as sms_sent")
