"""Local SQLite storage for M.A.N.G.O. node — store-and-forward outbox.

Implements the outbox pattern: every measurement is written locally first,
then the sync_manager flushes pending rows to the VPS backend.

SQLite is used because it is in Python's stdlib and is suitable for
embedded devices like the Jetson TK1. WAL mode reduces lock contention
between the acquire and sync processes.
"""

import os
import sqlite3
from datetime import datetime, timezone
from typing import Iterable, List, Optional

from .config import DB_PATH, VERBOSE


def _ensure_directory(path):
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)


def get_connection():
    con = sqlite3.connect(DB_PATH, timeout=5)
    con.execute("PRAGMA journal_mode=WAL;")
    con.execute("PRAGMA synchronous=NORMAL;")
    con.row_factory = sqlite3.Row
    return con


def init_db():
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

    _add_column_if_missing(cur, "measurements", "sms_sent",   "INTEGER NOT NULL DEFAULT 0")
    _add_column_if_missing(cur, "measurements", "packet_id",  "TEXT")
    _add_column_if_missing(cur, "measurements", "device_id",  "TEXT")
    _add_column_if_missing(cur, "measurements", "seq",        "INTEGER")
    _add_column_if_missing(cur, "measurements", "status",     "TEXT NOT NULL DEFAULT 'queued'")

    con.commit()
    con.close()


def _add_column_if_missing(cur, table, column, definition):
    try:
        cur.execute("ALTER TABLE {} ADD COLUMN {} {}".format(table, column, definition))
    except Exception:
        pass


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def insert_measurement(
    ph,           # type: Optional[float]
    turbidity,    # type: Optional[float]
    temperature,  # type: Optional[float]
    alert_level,  # type: str
    packet_id=None,   # type: Optional[str]
    device_id=None,   # type: Optional[str]
    seq=None,         # type: Optional[int]
):
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
                print("[db] duplicate packet_id={}, skipping".format(packet_id))
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
        print("[db] inserted id={} ph={} turb={} temp={} alert={} pkt={}".format(
            row_id, ph, turbidity, temperature, alert_level, packet_id))
    return row_id


def fetch_unsent(limit):
    """Return up to limit unsent rows ordered by ascending ID (oldest first)."""
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


def mark_sent(row_ids):
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
        print("[db] marked {} rows as sent".format(len(ids)))


def mark_failed(row_ids, error):
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
        print("[db] marked {} rows as failed: {}".format(len(ids), error[:80]))


def fetch_unsent_alerts(limit):
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


def fetch_latest_readings():
    """Return the most recent measurement row, or None if the table is empty."""
    con = get_connection()
    cur = con.cursor()
    row = cur.execute(
        "SELECT measured_at, ph, turbidity, temperature, alert_level FROM measurements ORDER BY id DESC LIMIT 1"
    ).fetchone()
    con.close()
    return row


def get_queue_stats():
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


def mark_sms_sent(row_id):
    con = get_connection()
    con.execute("UPDATE measurements SET sms_sent = 1 WHERE id = ?", (row_id,))
    con.commit()
    con.close()
    if VERBOSE:
        print("[db] marked row id={} as sms_sent".format(row_id))
