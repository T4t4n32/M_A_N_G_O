# -*- coding: utf-8 -*-
import os
import json
import sqlite3
import datetime
from config import DB_PATH, DEVICE_ID

def utc_now():
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

def get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=5000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def init_db():
    folder = os.path.dirname(DB_PATH)
    if folder and not os.path.isdir(folder):
        os.makedirs(folder)

    conn = get_conn()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS meta (
        k TEXT PRIMARY KEY,
        v TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        seq INTEGER NOT NULL,
        measured_at TEXT NOT NULL,
        alert_level TEXT NOT NULL DEFAULT 'normal',
        payload_json TEXT NOT NULL,
        sent INTEGER NOT NULL DEFAULT 0,
        sent_via TEXT,
        acked_at TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        UNIQUE(device_id, seq)
    );

    CREATE INDEX IF NOT EXISTS idx_measurements_pending
    ON measurements(sent, id);
    """)
    conn.commit()

    row = conn.execute("SELECT v FROM meta WHERE k='seq'").fetchone()
    if row is None:
        conn.execute("INSERT INTO meta(k, v) VALUES('seq', '0')")
        conn.commit()

    conn.close()

def _next_seq(conn):
    row = conn.execute("SELECT v FROM meta WHERE k='seq'").fetchone()
    current = int(row["v"])
    nxt = current + 1
    conn.execute("UPDATE meta SET v=? WHERE k='seq'", (str(nxt),))
    return nxt

def enqueue_measurement(payload_dict, alert_level):
    conn = get_conn()
    seq = _next_seq(conn)
    measured_at = utc_now()

    conn.execute("""
        INSERT OR IGNORE INTO measurements(
            device_id, seq, measured_at, alert_level, payload_json, sent
        ) VALUES (?, ?, ?, ?, ?, 0)
    """, (
        DEVICE_ID,
        seq,
        measured_at,
        alert_level,
        json.dumps(payload_dict, separators=(",", ":"))
    ))
    conn.commit()
    conn.close()
    return seq, measured_at

def list_pending(limit, critical_only=False):
    conn = get_conn()
    sql = """
        SELECT id, device_id, seq, measured_at, alert_level, payload_json
        FROM measurements
        WHERE sent=0
    """
    params = []
    if critical_only:
        sql += " AND alert_level <> 'normal'"
    sql += " ORDER BY id ASC LIMIT ?"
    params.append(limit)

    rows = conn.execute(sql, params).fetchall()
    conn.close()

    out = []
    for row in rows:
        payload = json.loads(row["payload_json"])
        out.append({
            "local_id": row["id"],
            "device_id": row["device_id"],
            "seq": row["seq"],
            "measured_at": row["measured_at"],
            "alert_level": row["alert_level"],
            "payload": payload
        })
    return out

def mark_sent(local_ids, via):
    if not local_ids:
        return
    conn = get_conn()
    now = utc_now()
    conn.executemany("""
        UPDATE measurements
        SET sent=1, sent_via=?, acked_at=?, last_error=NULL
        WHERE id=?
    """, [(via, now, x) for x in local_ids])
    conn.commit()
    conn.close()

def mark_failed(local_ids, err_text):
    if not local_ids:
        return
    conn = get_conn()
    conn.executemany("""
        UPDATE measurements
        SET retry_count = retry_count + 1,
            last_error = ?
        WHERE id=?
    """, [(err_text[:300], x) for x in local_ids])
    conn.commit()
    conn.close()