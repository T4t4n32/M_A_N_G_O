"""SQLite persistence layer for the M.A.N.G.O. edge node.

All functions accept an explicit db_path so callers do not need a global.
WAL mode is enabled for concurrent reader/writer access.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any


# ─── Schema ──────────────────────────────────────────────────────────────────

_DDL = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS missions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id  TEXT    NOT NULL UNIQUE,
    device_id   TEXT,
    state       TEXT    NOT NULL DEFAULT 'IDLE',
    started_at  TEXT,
    ended_at    TEXT,
    summary     TEXT,           -- JSON blob
    notes       TEXT,
    synced      INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id  TEXT,
    station     TEXT,
    source      TEXT,
    type        TEXT    NOT NULL,
    value       REAL    NOT NULL,
    unit        TEXT,
    ts_device   TEXT,
    ts_local    TEXT    NOT NULL,
    synced      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS imu_readings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id  TEXT,
    yaw         REAL,
    pitch       REAL,
    roll        REAL,
    qx          REAL,
    qy          REAL,
    qz          REAL,
    qw          REAL,
    calibration INTEGER,
    ts_local    TEXT    NOT NULL,
    synced      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pose_readings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id  TEXT,
    x           REAL,
    y           REAL,
    z           REAL,
    yaw         REAL,
    confidence  REAL,
    ts_local    TEXT    NOT NULL,
    synced      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id  TEXT,
    event_type  TEXT    NOT NULL,
    data        TEXT,           -- JSON blob
    ts_local    TEXT    NOT NULL,
    synced      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS commands (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id       INTEGER,    -- id from VPS
    device_id       TEXT,
    mission_id      TEXT,
    command         TEXT    NOT NULL,
    params          TEXT,       -- JSON blob
    status          TEXT    NOT NULL DEFAULT 'pending',
    received_at     TEXT    NOT NULL,
    executed_at     TEXT
);

CREATE TABLE IF NOT EXISTS sync_queue (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name  TEXT    NOT NULL,
    row_id      INTEGER NOT NULL,
    created_at  TEXT    NOT NULL,
    UNIQUE(table_name, row_id)
);

CREATE INDEX IF NOT EXISTS idx_sensor_mission  ON sensor_readings(mission_id);
CREATE INDEX IF NOT EXISTS idx_sensor_synced   ON sensor_readings(synced);
CREATE INDEX IF NOT EXISTS idx_imu_mission     ON imu_readings(mission_id);
CREATE INDEX IF NOT EXISTS idx_pose_mission    ON pose_readings(mission_id);
CREATE INDEX IF NOT EXISTS idx_events_mission  ON events(mission_id);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
"""


def init_db(path: str) -> None:
    """Create all tables. Safe to call multiple times."""
    with sqlite3.connect(path) as conn:
        conn.executescript(_DDL)


def get_db(path: str) -> sqlite3.Connection:
    """Return a sqlite3 connection with WAL + row_factory set."""
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─── Mission helpers ──────────────────────────────────────────────────────────

def create_mission(path: str, mission_id: str, device_id: str | None = None,
                   state: str = "IDLE") -> dict:
    now = _now()
    with get_db(path) as conn:
        conn.execute(
            """INSERT OR IGNORE INTO missions
               (mission_id, device_id, state, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?)""",
            (mission_id, device_id, state, now, now),
        )
    return get_mission(path, mission_id)


def update_mission_state(path: str, mission_id: str, state: str,
                         extra: dict | None = None) -> None:
    now = _now()
    updates: list[tuple[Any, ...]] = []

    started_at = None
    ended_at = None
    if state == "FIELD_RUNNING":
        started_at = now
    if state in ("MISSION_FINISHED", "SYNCING", "STANDBY"):
        ended_at = now

    with get_db(path) as conn:
        conn.execute(
            "UPDATE missions SET state=?, updated_at=? WHERE mission_id=?",
            (state, now, mission_id),
        )
        if started_at:
            conn.execute(
                "UPDATE missions SET started_at=? WHERE mission_id=? AND started_at IS NULL",
                (started_at, mission_id),
            )
        if ended_at:
            conn.execute(
                "UPDATE missions SET ended_at=? WHERE mission_id=? AND ended_at IS NULL",
                (ended_at, mission_id),
            )
        if extra and extra.get("summary"):
            conn.execute(
                "UPDATE missions SET summary=? WHERE mission_id=?",
                (json.dumps(extra["summary"]), mission_id),
            )


def get_mission(path: str, mission_id: str) -> dict | None:
    with get_db(path) as conn:
        row = conn.execute(
            "SELECT * FROM missions WHERE mission_id=?", (mission_id,)
        ).fetchone()
    if row is None:
        return None
    d = dict(row)
    if d.get("summary"):
        try:
            d["summary"] = json.loads(d["summary"])
        except Exception:
            pass
    return d


def get_current_mission(path: str) -> dict | None:
    """Return the most recently updated non-finished mission, or None."""
    active_states = ("BOOT", "SELF_CHECK", "IDLE", "ARMED",
                     "FIELD_RUNNING", "PAUSED", "RETURNING", "ERROR")
    placeholders = ",".join("?" * len(active_states))
    with get_db(path) as conn:
        row = conn.execute(
            f"SELECT * FROM missions WHERE state IN ({placeholders})"
            " ORDER BY updated_at DESC LIMIT 1",
            active_states,
        ).fetchone()
    return dict(row) if row else None


def list_missions(path: str, limit: int = 50) -> list[dict]:
    with get_db(path) as conn:
        rows = conn.execute(
            "SELECT * FROM missions ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(r) for r in rows]


# ─── Reading helpers ──────────────────────────────────────────────────────────

def insert_sensor_reading(path: str, mission_id: str | None, station: str | None,
                          source: str | None, readings: dict,
                          ts_device: str | None = None) -> int:
    """Insert one row per key in readings dict. Returns count inserted."""
    now = _now()
    UNIT_MAP = {"ph": "pH", "turbidity_ntu": "NTU", "temperature_c": "°C"}
    count = 0
    with get_db(path) as conn:
        for key, val in readings.items():
            try:
                value = float(val)
            except (TypeError, ValueError):
                continue
            conn.execute(
                """INSERT INTO sensor_readings
                   (mission_id, station, source, type, value, unit, ts_device, ts_local)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (mission_id, station, source, key, value,
                 UNIT_MAP.get(key), ts_device, now),
            )
            count += 1
    return count


def insert_imu(path: str, payload: dict) -> int:
    now = _now()
    with get_db(path) as conn:
        conn.execute(
            """INSERT INTO imu_readings
               (mission_id, yaw, pitch, roll, qx, qy, qz, qw, calibration, ts_local)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                payload.get("mission_id"),
                payload.get("yaw"), payload.get("pitch"), payload.get("roll"),
                payload.get("qx"), payload.get("qy"),
                payload.get("qz"), payload.get("qw"),
                payload.get("calibration"), now,
            ),
        )
    return 1


def insert_pose(path: str, payload: dict) -> int:
    now = _now()
    with get_db(path) as conn:
        conn.execute(
            """INSERT INTO pose_readings
               (mission_id, x, y, z, yaw, confidence, ts_local)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                payload.get("mission_id"),
                payload.get("x"), payload.get("y"), payload.get("z"),
                payload.get("yaw"), payload.get("confidence"), now,
            ),
        )
    return 1


def insert_event(path: str, mission_id: str | None, event_type: str,
                 data: dict | None = None) -> int:
    now = _now()
    with get_db(path) as conn:
        conn.execute(
            "INSERT INTO events (mission_id, event_type, data, ts_local) VALUES (?, ?, ?, ?)",
            (mission_id, event_type, json.dumps(data) if data else None, now),
        )
    return 1


# ─── Command helpers ──────────────────────────────────────────────────────────

def store_command(path: str, remote_id: int, device_id: str | None,
                  mission_id: str | None, command: str,
                  params: dict | None = None) -> None:
    now = _now()
    with get_db(path) as conn:
        conn.execute(
            """INSERT OR IGNORE INTO commands
               (remote_id, device_id, mission_id, command, params, received_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (remote_id, device_id, mission_id, command,
             json.dumps(params) if params else None, now),
        )


def list_pending_commands(path: str) -> list[dict]:
    with get_db(path) as conn:
        rows = conn.execute(
            "SELECT * FROM commands WHERE status='pending' ORDER BY received_at ASC"
        ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        if d.get("params"):
            try:
                d["params"] = json.loads(d["params"])
            except Exception:
                pass
        result.append(d)
    return result


def mark_command_done(path: str, command_id: int, status: str = "executed") -> None:
    now = _now()
    with get_db(path) as conn:
        conn.execute(
            "UPDATE commands SET status=?, executed_at=? WHERE id=?",
            (status, now, command_id),
        )


# ─── Sync queue helpers ───────────────────────────────────────────────────────

def get_unsynced_sensor_readings(path: str, limit: int = 100) -> list[dict]:
    with get_db(path) as conn:
        rows = conn.execute(
            "SELECT * FROM sensor_readings WHERE synced=0 ORDER BY id ASC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def mark_sensor_readings_synced(path: str, ids: list[int]) -> None:
    if not ids:
        return
    placeholders = ",".join("?" * len(ids))
    with get_db(path) as conn:
        conn.execute(
            f"UPDATE sensor_readings SET synced=1 WHERE id IN ({placeholders})", ids
        )


def get_unsynced_missions(path: str) -> list[dict]:
    with get_db(path) as conn:
        rows = conn.execute(
            "SELECT * FROM missions WHERE synced=0 AND state='MISSION_FINISHED'"
            " ORDER BY ended_at ASC"
        ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        if d.get("summary"):
            try:
                d["summary"] = json.loads(d["summary"])
            except Exception:
                pass
        result.append(d)
    return result


def mark_mission_synced(path: str, mission_id: str) -> None:
    with get_db(path) as conn:
        conn.execute(
            "UPDATE missions SET synced=1 WHERE mission_id=?", (mission_id,)
        )
