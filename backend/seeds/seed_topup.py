#!/usr/bin/env python3
"""
Top-up seed: extends mango_compat_readings from the last stored timestamp to now.

Run inside mango_backend container:
    python seeds/seed_topup.py

Safe to run multiple times — starts from MAX(ts) so it never duplicates rows.
"""

import sys
import os
import math
import random
from datetime import datetime, timedelta, timezone

random.seed(99)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app
from app.extensions import db
from app.models_compat import CompatStation, CompatReading, IngestPacket, DeviceRegistry
from app.models.alert import AlertRule, AlertEvent
from sqlalchemy import text

STATION_NAME = "MANGO Estación Principal"
DEVICE_ID    = "MANGO-V2-001"
STEP         = timedelta(minutes=5)
BATCH        = 3000
ALERT_COOLDOWN_MINUTES = 90

# Thresholds (must match backend _THRESHOLDS / frontend SENSOR_THRESHOLDS)
THRESHOLDS = {
    "ph":          {"warning": (5.5, 9.5), "critical": (4.0, 10.5)},
    "temperature": {"warning": (10.0, 35.0), "critical": (5.0, 40.0)},
    "turbidity":   {"warning": (0.0, 10.0), "critical": (0.0, 50.0)},
}

# Scenarios anchored to day-0 = May 15 2026
# (start_day, end_day, ph_lo, ph_hi, temp_lo, temp_hi, turb_lo, turb_hi)
TOPUP_START_REF = datetime(2026, 5, 15, 12, 0, 0, tzinfo=timezone.utc)

SCENARIOS = [
    ( 0,  10,  7.20, 7.70, 25.0, 27.5, 2.0,  4.5, "Recuperacion continuada"),
    (10,  20,  7.30, 7.80, 24.5, 27.0, 1.5,  3.5, "Linea base estable"),
    (20,  27,  7.10, 7.60, 24.0, 26.5, 3.5,  8.5, "Evento turbidez menor"),
    (27,  34,  7.25, 7.75, 23.5, 26.0, 1.8,  3.8, "Recuperacion post-turbidez"),
]


def _find_scenario(day_offset: float):
    for sc in SCENARIOS:
        if sc[0] <= day_offset < sc[1]:
            return sc
    return SCENARIOS[-1]


def _gen_reading(ts: datetime):
    day = (ts - TOPUP_START_REF).total_seconds() / 86400
    sc  = _find_scenario(day)
    span = max(1, sc[1] - sc[0])
    prog = (day - sc[0]) / span
    drift = math.sin(math.pi * prog)
    hour  = ts.hour + ts.minute / 60

    ph_lo, ph_hi = sc[2], sc[3]
    ph_c, ph_a   = (ph_lo + ph_hi) / 2, (ph_hi - ph_lo) / 2
    ph = (
        ph_c
        + ph_a * 0.35 * drift
        + ph_a * 0.20 * math.sin(2 * math.pi * (hour - 15) / 24)
        + random.gauss(0, ph_a * 0.07)
    )
    ph = max(3.5, min(11.0, round(ph, 2)))

    te_lo, te_hi = sc[4], sc[5]
    te_c, te_a   = (te_lo + te_hi) / 2, (te_hi - te_lo) / 2
    temp = (
        te_c
        + te_a * 0.45 * drift
        + te_a * 0.40 * math.sin(2 * math.pi * (hour - 20) / 24)
        + random.gauss(0, te_a * 0.05)
    )
    temp = max(10.0, min(42.0, round(temp, 2)))

    tu_lo, tu_hi = sc[6], sc[7]
    tu_c, tu_a   = (tu_lo + tu_hi) / 2, (tu_hi - tu_lo) / 2
    turb = (
        tu_c
        + tu_a * 0.50 * drift
        + tu_a * 0.20 * math.sin(2 * math.pi * (hour - 10) / 24)
        + random.gauss(0, tu_a * 0.10)
    )
    turb = max(0.05, min(60.0, round(turb, 2)))

    return ph, temp, turb


def _check_alert(ts, sensor_type, value, rules, last_alert_ts):
    thresh = THRESHOLDS.get(sensor_type, {})
    events = []
    for level in ("critical", "warning"):
        lo, hi = thresh.get(level, (None, None))
        if lo is None:
            continue
        triggered = (value < lo) or (value > hi)
        if not triggered:
            continue
        key = (sensor_type, level)
        last = last_alert_ts.get(key)
        if last and (ts - last).total_seconds() < ALERT_COOLDOWN_MINUTES * 60:
            continue
        rule = rules.get((sensor_type, level))
        if not rule:
            continue
        last_alert_ts[key] = ts
        unit_map  = {"ph": "pH", "temperature": "°C", "turbidity": "NTU"}
        label_map = {"ph": "pH", "temperature": "Temperatura", "turbidity": "Turbidez"}
        unit  = unit_map.get(sensor_type, "")
        label = label_map.get(sensor_type, sensor_type)
        cmp_label = "sobre" if value > hi else "bajo"
        threshold = hi if value > hi else lo
        msg = (
            f"[{level.upper()}] {label}: {value:.2f} {unit} — "
            f"{cmp_label} umbral de {threshold} {unit}. "
            f"Estación: {STATION_NAME}"
        )
        events.append({
            "station_name": STATION_NAME,
            "sensor_type":  sensor_type,
            "value":        float(value),
            "alert_level":  level,
            "rule_id":      rule.id,
            "contact_id":   None,
            "message":      msg,
            "sms_sent":     False,
            "sms_sent_at":  None,
            "sms_error":    None,
            "measured_at":  ts,
            "created_at":   ts,
        })
        break  # only the most severe level per sensor per cooldown window
    return events


def run():
    app = create_app()
    with app.app_context():
        station = CompatStation.query.filter_by(name=STATION_NAME).first()
        if not station:
            print("ERROR: station not found — run seed_historical.py first.")
            sys.exit(1)

        latest_ts = db.session.execute(
            text("SELECT MAX(ts) FROM mango_compat_readings WHERE station_id = :sid"),
            {"sid": station.id},
        ).scalar()

        if not latest_ts:
            print("ERROR: no existing readings found.")
            sys.exit(1)

        if latest_ts.tzinfo is None:
            latest_ts = latest_ts.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        start_ts = latest_ts + STEP

        if start_ts >= now:
            print(f"Already up to date (latest: {latest_ts.isoformat()}). Nothing to insert.")
            return

        total_steps = int((now - start_ts).total_seconds() / STEP.total_seconds())
        print(f"  Starting from {start_ts.isoformat()} to {now.isoformat()}")
        print(f"  Steps: {total_steps:,}  (~{total_steps * 3:,} rows)")

        # Load alert rules indexed by (sensor_type, level)
        rules = {}
        for r in AlertRule.query.filter_by(enabled=True).all():
            key = (r.sensor_type, r.level)
            if key not in rules:
                rules[key] = r

        last_alert_ts = {}
        readings_buf  = []
        alerts_buf    = []
        inserted_total = 0
        seq = db.session.execute(
            text("SELECT COUNT(*) FROM mango_ingest_packets"),
        ).scalar() + 1

        ts = start_ts
        step_n = 0

        while ts <= now:
            ph, temp, turb = _gen_reading(ts)

            for sensor_type, value, unit in [
                ("ph",        ph,   "pH"),
                ("temp",      temp, "°C"),
                ("turbidity", turb, "NTU"),
            ]:
                readings_buf.append({
                    "station_id": station.id,
                    "type":       sensor_type,
                    "value":      value,
                    "unit":       unit,
                    "ts":         ts,
                    "packet_id":  None,
                    "mission_id": None,
                })
                # alert check uses display name for threshold lookup
                display = "temperature" if sensor_type == "temp" else sensor_type
                alerts_buf.extend(_check_alert(ts, display, value, rules, last_alert_ts))

            ts     += STEP
            step_n += 1

            if len(readings_buf) >= BATCH:
                db.session.bulk_insert_mappings(CompatReading, readings_buf)
                db.session.bulk_insert_mappings(AlertEvent, alerts_buf)
                db.session.commit()
                inserted_total += len(readings_buf)
                print(f"    {inserted_total:>8,} rows inserted …")
                readings_buf = []
                alerts_buf   = []

        if readings_buf:
            db.session.bulk_insert_mappings(CompatReading, readings_buf)
            db.session.bulk_insert_mappings(AlertEvent, alerts_buf)
            db.session.commit()
            inserted_total += len(readings_buf)

        # Update device last_seen
        device = DeviceRegistry.query.filter_by(device_id=DEVICE_ID).first()
        if device:
            device.last_seen    = now
            device.total_packets = (device.total_packets or 0) + step_n
            db.session.commit()

        rc = db.session.execute(text("SELECT COUNT(*) FROM mango_compat_readings")).scalar()
        ae = db.session.execute(text("SELECT COUNT(*) FROM mango_alert_events")).scalar()
        print(f"\n  Rows inserted this run : {inserted_total:>8,}")
        print(f"  mango_compat_readings  : {rc:>8,} total")
        print(f"  mango_alert_events     : {ae:>8,} total")
        print(f"  Coverage now extends to: {now.date()}")
        print("\nDone.\n")


if __name__ == "__main__":
    run()
