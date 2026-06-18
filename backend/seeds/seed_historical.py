#!/usr/bin/env python3
"""
Historical sensor data seed for M.A.N.G.O.

Generates ~135 days of ecological sensor readings (Jan 1 – May 15, 2026)
covering distinct ecosystem states: healthy baseline, sediment event,
chemical stress, thermal stress, algal bloom, and gradual recovery.

Usage (inside mango_backend container):
    python seeds/seed_historical.py

Safe to run multiple times — checks for existing data before inserting.
"""

import sys
import os
import math
import random
from datetime import datetime, timedelta, timezone

random.seed(42)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app
from app.extensions import db
from app.models_compat import CompatStation, CompatReading, IngestPacket, DeviceRegistry
from app.models.alert import AlertRule, AlertEvent
from app.models.mission import Mission, MissionEvent
from sqlalchemy import text

# ─── Configuration ─────────────────────────────────────────────────────────────

STATION_NAME = "MANGO Estación Principal"
DEVICE_ID    = "MANGO-V2-001"

START = datetime(2026, 1, 1,  0,  0, 0, tzinfo=timezone.utc)
END   = datetime(2026, 5, 15, 12,  0, 0, tzinfo=timezone.utc)
STEP  = timedelta(minutes=5)
BATCH = 4000

# Ecological scenario anchors:
# (start_day, end_day, ph_lo, ph_hi, temp_lo, temp_hi, turb_lo, turb_hi, label)
SCENARIOS = [
    ( 0,  20,  7.20, 7.80, 24.0, 27.0,  1.5,  4.0, "Baseline saludable"),
    (20,  28,  7.00, 7.40, 25.0, 27.0,  5.0, 13.5, "Evento sedimentos"),
    (28,  46,  7.30, 7.70, 24.0, 26.0,  2.0,  4.5, "Recuperacion post-sedimento"),
    (46,  58,  5.20, 6.40, 25.0, 28.5,  3.0,  5.5, "Estres quimico"),
    (58,  69,  6.80, 7.40, 25.0, 27.0,  2.0,  4.0, "Estabilizacion"),
    (69,  79,  7.50, 8.30, 29.0, 33.5,  4.0,  8.5, "Estres termico"),
    (79,  95,  8.40, 9.30, 28.0, 31.0,  8.0, 16.0, "Floracion de algas"),
    (95, 136,  7.20, 7.80, 24.0, 27.0,  2.0,  4.0, "Recuperacion gradual"),
]

# Alert rules to seed (sensor_type, comparison, threshold, level)
ALERT_RULES_DEF = [
    ("ph",          "below", 6.5,  "warning"),
    ("ph",          "below", 5.5,  "critical"),
    ("ph",          "above", 8.5,  "warning"),
    ("ph",          "above", 9.2,  "critical"),
    ("temperature", "above", 30.0, "warning"),
    ("temperature", "above", 34.0, "critical"),
    ("turbidity",   "above", 5.0,  "warning"),
    ("turbidity",   "above", 14.0, "critical"),
]

# Cooldown between consecutive alert events for the same rule (minutes)
ALERT_COOLDOWN_MINUTES = 90

# ─── Value generation ──────────────────────────────────────────────────────────

def _find_scenario(day_offset: float):
    for sc in SCENARIOS:
        if sc[0] <= day_offset < sc[1]:
            return sc
    return SCENARIOS[-1]


def _blend(a_lo, a_hi, b_lo, b_hi, alpha):
    """Linear blend between two ranges."""
    lo = a_lo + (b_lo - a_lo) * alpha
    hi = a_hi + (b_hi - a_hi) * alpha
    return lo, hi


def _gen_reading(ts: datetime):
    day = (ts - START).total_seconds() / 86400
    sc  = _find_scenario(day)

    # Progress within this scenario (0 → 1), used for intra-scenario drift
    span = max(1, sc[1] - sc[0])
    prog = (day - sc[0]) / span

    # Smooth intra-scenario drift: rises in first half, falls in second half
    drift = math.sin(math.pi * prog)  # 0 → 1 → 0 arc

    hour = ts.hour + ts.minute / 60

    # pH: slight diurnal rise in afternoon (photosynthesis), noise
    ph_lo, ph_hi = sc[2], sc[3]
    ph_center = (ph_lo + ph_hi) / 2
    ph_amp    = (ph_hi - ph_lo) / 2
    ph = (
        ph_center
        + ph_amp * 0.40 * drift
        + ph_amp * 0.20 * math.sin(2 * math.pi * (hour - 15) / 24)
        + random.gauss(0, ph_amp * 0.07)
    )
    ph = max(3.5, min(11.0, round(ph, 2)))

    # Temperature: peaks ~14:00-16:00 local (UTC-5 = 19:00-21:00 UTC in Valle del Cauca)
    te_lo, te_hi = sc[4], sc[5]
    te_center = (te_lo + te_hi) / 2
    te_amp    = (te_hi - te_lo) / 2
    temp = (
        te_center
        + te_amp * 0.50 * drift
        + te_amp * 0.40 * math.sin(2 * math.pi * (hour - 20) / 24)
        + random.gauss(0, te_amp * 0.05)
    )
    temp = max(10.0, min(42.0, round(temp, 2)))

    # Turbidity: higher mid-morning after rainfall mixing, scenario-driven
    tu_lo, tu_hi = sc[6], sc[7]
    tu_center = (tu_lo + tu_hi) / 2
    tu_amp    = (tu_hi - tu_lo) / 2
    turb = (
        tu_center
        + tu_amp * 0.55 * drift
        + tu_amp * 0.20 * math.sin(2 * math.pi * (hour - 10) / 24)
        + random.gauss(0, tu_amp * 0.10)
    )
    turb = max(0.05, min(60.0, round(turb, 2)))

    return ph, temp, turb


# ─── Alert event builder ───────────────────────────────────────────────────────

def _build_alert_event(ts, sensor_type, value, rule, station_name):
    unit_map  = {"ph": "pH", "temperature": "°C", "turbidity": "NTU"}
    label_map = {"ph": "pH", "temperature": "Temperatura", "turbidity": "Turbidez"}
    unit  = unit_map.get(sensor_type, "")
    label = label_map.get(sensor_type, sensor_type)
    cmp_label = "sobre" if rule.comparison == "above" else "bajo"
    msg = (
        f"[{rule.level.upper()}] {label}: {value:.2f} {unit} — "
        f"{cmp_label} umbral de {rule.threshold} {unit}. "
        f"Estación: {station_name}"
    )
    return {
        "station_name": station_name,
        "sensor_type":  sensor_type,
        "value":        float(value),
        "alert_level":  rule.level,
        "rule_id":      rule.id,
        "contact_id":   None,
        "message":      msg,
        "sms_sent":     False,
        "sms_sent_at":  None,
        "sms_error":    None,
        "measured_at":  ts,
        "created_at":   ts,
    }


# ─── Main ──────────────────────────────────────────────────────────────────────

def run():
    app = create_app()
    with app.app_context():
        db.create_all()
        print("Database tables verified.")

        # ── 1. Station ──────────────────────────────────────────────────────────
        station = CompatStation.query.filter_by(name=STATION_NAME).first()
        if not station:
            station = CompatStation(name=STATION_NAME)
            db.session.add(station)
            db.session.commit()
            print(f"  Station created: {STATION_NAME}")
        else:
            print(f"  Station found:   {STATION_NAME} (id={station.id})")

        # ── 2. Device ───────────────────────────────────────────────────────────
        device = DeviceRegistry.query.filter_by(device_id=DEVICE_ID).first()
        if not device:
            device = DeviceRegistry(
                device_id=DEVICE_ID,
                station_name=STATION_NAME,
                last_seen=END,
                last_seq=1,
                total_packets=0,
                status="offline",
            )
            db.session.add(device)
            db.session.commit()
            print(f"  Device registered: {DEVICE_ID}")
        else:
            print(f"  Device found:      {DEVICE_ID}")

        # ── 3. Alert Rules ──────────────────────────────────────────────────────
        existing_rules = {
            (r.sensor_type, r.comparison, r.threshold, r.level): r
            for r in AlertRule.query.all()
        }
        rules_added = 0
        active_rules = dict(existing_rules)

        for (sensor_type, comparison, threshold, level) in ALERT_RULES_DEF:
            key = (sensor_type, comparison, threshold, level)
            if key not in active_rules:
                rule = AlertRule(
                    sensor_type=sensor_type,
                    comparison=comparison,
                    threshold=threshold,
                    level=level,
                    enabled=True,
                )
                db.session.add(rule)
                active_rules[key] = rule
                rules_added += 1

        db.session.commit()
        # Refresh to get IDs for newly inserted rules
        for key, rule in active_rules.items():
            db.session.refresh(rule)

        print(f"  Alert rules: {len(active_rules)} total ({rules_added} new)")

        # ── 4. Readings + Alert Events ──────────────────────────────────────────
        existing_count = db.session.execute(
            text("SELECT COUNT(*) FROM mango_compat_readings WHERE station_id = :sid"),
            {"sid": station.id},
        ).scalar()

        if existing_count > 100:
            print(f"\n  Readings already exist ({existing_count:,} rows). Skipping insertion.")
            print("  To reseed, delete rows from mango_compat_readings and re-run.")
        else:
            print(f"\n  Generating readings from {START.date()} to {END.date()} …")

            readings_buf  = []
            packets_buf   = []
            alerts_buf    = []

            # Cooldown per (sensor_type, rule_key) to limit event density
            last_alert_ts = {}

            seq   = 1
            ts    = START
            total = 0

            while ts <= END:
                ph, temp, turb = _gen_reading(ts)
                pkt_id = f"HIST-{ts.strftime('%Y%m%d%H%M')}-{seq:06d}"

                # Readings row for each sensor
                for dtype, value, unit in [
                    ("ph",         ph,   "pH"),
                    ("temp",       temp, "°C"),
                    ("turbidity",  turb, "NTU"),
                ]:
                    readings_buf.append({
                        "station_id": station.id,
                        "type":       dtype,
                        "value":      value,
                        "unit":       unit,
                        "ts":         ts,
                    })

                # Ingest packet record
                packets_buf.append({
                    "packet_id":         pkt_id,
                    "device_id":         DEVICE_ID,
                    "seq":               seq,
                    "station_name":      STATION_NAME,
                    "created_at_device": ts,
                    "created_at_edge":   ts,
                    "received_at":       ts + timedelta(seconds=random.randint(2, 45)),
                    "readings_count":    3,
                })

                # Alert evaluation
                for sensor_type, value in [("ph", ph), ("temperature", temp), ("turbidity", turb)]:
                    for (st, cmp, thresh, level), rule in active_rules.items():
                        if st != sensor_type:
                            continue
                        triggered = (
                            (cmp == "above" and value > thresh)
                            or (cmp == "below" and value < thresh)
                        )
                        if not triggered:
                            continue
                        cooldown_key = (sensor_type, level, cmp)
                        last_ts = last_alert_ts.get(cooldown_key)
                        if last_ts and (ts - last_ts).total_seconds() < ALERT_COOLDOWN_MINUTES * 60:
                            continue
                        alerts_buf.append(_build_alert_event(ts, sensor_type, value, rule, STATION_NAME))
                        last_alert_ts[cooldown_key] = ts

                seq += 1
                ts  += STEP

                if len(readings_buf) >= BATCH:
                    db.session.execute(CompatReading.__table__.insert(), readings_buf)
                    db.session.execute(IngestPacket.__table__.insert(), packets_buf)
                    if alerts_buf:
                        db.session.execute(AlertEvent.__table__.insert(), alerts_buf)
                        alerts_buf = []
                    db.session.commit()
                    total += len(readings_buf)
                    print(f"    {total:>7,} readings …  ({ts.date()})")
                    readings_buf = []
                    packets_buf  = []

            # Flush remainder
            if readings_buf:
                db.session.execute(CompatReading.__table__.insert(), readings_buf)
                db.session.execute(IngestPacket.__table__.insert(), packets_buf)
                if alerts_buf:
                    db.session.execute(AlertEvent.__table__.insert(), alerts_buf)
                db.session.commit()
                total += len(readings_buf)

            # Update device stats
            device = DeviceRegistry.query.filter_by(device_id=DEVICE_ID).first()
            device.total_packets = seq - 1
            device.last_seen     = END
            device.last_seq      = seq - 1
            db.session.commit()

            ae_count = db.session.execute(
                text("SELECT COUNT(*) FROM mango_alert_events")
            ).scalar()
            print(f"\n  Readings inserted:     {total:,}")
            print(f"  Alert events created:  {ae_count:,}")

        # ── 5. Missions ─────────────────────────────────────────────────────────
        existing_missions = Mission.query.count()
        if existing_missions > 0:
            print(f"\n  Missions already exist ({existing_missions}). Skipping.")
        else:
            missions_def = [
                {
                    "mission_id": "TEST-COMP-2025-12",
                    "device_id":  DEVICE_ID,
                    "state":      "MISSION_FINISHED",
                    "started_at": datetime(2025, 12, 15,  9,  0, 0, tzinfo=timezone.utc),
                    "ended_at":   datetime(2025, 12, 16, 17,  0, 0, tzinfo=timezone.utc),
                    "notes": (
                        "Prueba de integración en laboratorio CALIBOTS. "
                        "Verificación de lectura continua de los tres sensores, "
                        "comunicación serial ESP32-Jetson y transmisión LTE al servidor."
                    ),
                    "summary": {
                        "packets_received": 864,
                        "duration_hours": 32,
                        "avg_ph": 7.35,
                        "avg_temp_c": 25.8,
                        "avg_turbidity_ntu": 2.1,
                        "alerts_generated": 0,
                        "location": "Laboratorio CALIBOTS, Cali",
                    },
                    "events": [
                        ("BOOT",       {"version": "Sensors_V2.0.0", "device": DEVICE_ID},
                         datetime(2025, 12, 15,  8, 55, 0, tzinfo=timezone.utc)),
                        ("SELF_CHECK", {"status": "ok", "sensors_online": 3, "lte_signal": "good"},
                         datetime(2025, 12, 15,  9,  0, 0, tzinfo=timezone.utc)),
                        ("ARM",        {"operator": "CALIBOTS-Lab"},
                         datetime(2025, 12, 15,  9,  5, 0, tzinfo=timezone.utc)),
                        ("START_TEST", {"mode": "bench_continuous", "planned_hours": 32},
                         datetime(2025, 12, 15,  9, 10, 0, tzinfo=timezone.utc)),
                        ("SYNC_DATA",  {"packets": 864, "dropped": 0, "sync_ok": True},
                         datetime(2025, 12, 16, 16, 45, 0, tzinfo=timezone.utc)),
                        ("STOP",       {"reason": "test_complete", "status": "success"},
                         datetime(2025, 12, 16, 17,  0, 0, tzinfo=timezone.utc)),
                    ],
                },
                {
                    "mission_id": "CAMPO-CALIMA-2026-01",
                    "device_id":  DEVICE_ID,
                    "state":      "MISSION_FINISHED",
                    "started_at": datetime(2026, 1, 15,  8, 30, 0, tzinfo=timezone.utc),
                    "ended_at":   datetime(2026, 1, 16, 18,  0, 0, tzinfo=timezone.utc),
                    "notes": (
                        "Primer despliegue de campo en el humedal Lago Calima, "
                        "Valle del Cauca. Monitoreo continuo bajo condiciones de lluvia "
                        "moderada. Se registró aumento de turbidez por arrastre de sedimentos "
                        "en la noche del 15 al 16 de enero. Sensores respondieron dentro de "
                        "los rangos esperados."
                    ),
                    "summary": {
                        "packets_received": 432,
                        "duration_hours": 33.5,
                        "avg_ph": 7.38,
                        "avg_temp_c": 25.7,
                        "avg_turbidity_ntu": 4.8,
                        "alerts_generated": 2,
                        "location": "Lago Calima, Valle del Cauca",
                        "coordinates": {"lat": 3.906, "lon": -76.528},
                    },
                    "events": [
                        ("BOOT",        {"version": "Sensors_V2.0.0"},
                         datetime(2026, 1, 15,  8, 20, 0, tzinfo=timezone.utc)),
                        ("SELF_CHECK",  {"status": "ok", "sensors_online": 3},
                         datetime(2026, 1, 15,  8, 30, 0, tzinfo=timezone.utc)),
                        ("ARM",         {"operator": "CALIBOTS-Field"},
                         datetime(2026, 1, 15,  8, 40, 0, tzinfo=timezone.utc)),
                        ("START_FIELD", {"location": "Lago Calima", "lat": 3.906, "lon": -76.528},
                         datetime(2026, 1, 15,  9,  0, 0, tzinfo=timezone.utc)),
                        ("SYNC_DATA",   {"packets": 432, "dropped": 1, "sync_ok": True},
                         datetime(2026, 1, 16, 17, 30, 0, tzinfo=timezone.utc)),
                        ("STOP",        {"reason": "field_complete", "status": "success"},
                         datetime(2026, 1, 16, 18,  0, 0, tzinfo=timezone.utc)),
                    ],
                },
                {
                    "mission_id": "CAMPO-ROZO-2026-02",
                    "device_id":  DEVICE_ID,
                    "state":      "MISSION_FINISHED",
                    "started_at": datetime(2026, 2, 20,  7, 45, 0, tzinfo=timezone.utc),
                    "ended_at":   datetime(2026, 2, 21, 16, 30, 0, tzinfo=timezone.utc),
                    "notes": (
                        "Monitoreo en zona de manglar periurbano en el municipio de Rozo. "
                        "Se identificaron valores de pH inusualmente bajos (entre 6.0 y 6.3) "
                        "posiblemente asociados a escorrentía agrícola de cultivos adyacentes. "
                        "Se activaron siete eventos de alerta de advertencia. "
                        "Los datos obtenidos en esta misión contribuyen al análisis de "
                        "presión antrópica sobre el ecosistema."
                    ),
                    "summary": {
                        "packets_received": 396,
                        "duration_hours": 32.75,
                        "avg_ph": 6.12,
                        "avg_temp_c": 26.9,
                        "avg_turbidity_ntu": 4.2,
                        "alerts_generated": 7,
                        "location": "Rozo, Valle del Cauca",
                        "coordinates": {"lat": 3.619, "lon": -76.432},
                    },
                    "events": [
                        ("BOOT",        {"version": "Sensors_V2.0.0"},
                         datetime(2026, 2, 20,  7, 30, 0, tzinfo=timezone.utc)),
                        ("SELF_CHECK",  {"status": "ok", "sensors_online": 3},
                         datetime(2026, 2, 20,  7, 45, 0, tzinfo=timezone.utc)),
                        ("ARM",         {"operator": "CALIBOTS-Field"},
                         datetime(2026, 2, 20,  7, 55, 0, tzinfo=timezone.utc)),
                        ("START_FIELD", {"location": "Manglar Rozo", "lat": 3.619, "lon": -76.432},
                         datetime(2026, 2, 20,  8, 10, 0, tzinfo=timezone.utc)),
                        ("SYNC_DATA",   {"packets": 396, "dropped": 3, "sync_ok": True},
                         datetime(2026, 2, 21, 16,  0, 0, tzinfo=timezone.utc)),
                        ("STOP",        {"reason": "field_complete", "status": "success"},
                         datetime(2026, 2, 21, 16, 30, 0, tzinfo=timezone.utc)),
                    ],
                },
            ]

            print("\n  Creating missions …")
            for mdef in missions_def:
                m = Mission(
                    mission_id=mdef["mission_id"],
                    device_id=mdef["device_id"],
                    state=mdef["state"],
                    started_at=mdef["started_at"],
                    ended_at=mdef["ended_at"],
                    notes=mdef["notes"],
                    summary=mdef["summary"],
                )
                db.session.add(m)
                db.session.flush()

                for etype, edata, ets in mdef["events"]:
                    db.session.add(MissionEvent(
                        mission_ref_id=m.id,
                        mission_id=mdef["mission_id"],
                        event_type=etype,
                        data=edata,
                        ts=ets,
                    ))

                db.session.commit()
                dur = m.duration_seconds()
                hours = int(dur / 3600) if dur else 0
                print(f"    {mdef['mission_id']}  ({hours}h)")

        # ── Summary ──────────────────────────────────────────────────────────────
        rc  = db.session.execute(text("SELECT COUNT(*) FROM mango_compat_readings")).scalar()
        ae  = db.session.execute(text("SELECT COUNT(*) FROM mango_alert_events")).scalar()
        mc  = db.session.execute(text("SELECT COUNT(*) FROM mango_missions")).scalar()
        ar  = db.session.execute(text("SELECT COUNT(*) FROM mango_alert_rules WHERE enabled")).scalar()
        pkt = db.session.execute(text("SELECT COUNT(*) FROM mango_ingest_packets")).scalar()

        print("\n─── Seed summary ──────────────────────────────────────────────────────────")
        print(f"  mango_compat_readings  : {rc:>8,}")
        print(f"  mango_ingest_packets   : {pkt:>8,}")
        print(f"  mango_alert_rules      : {ar:>8}")
        print(f"  mango_alert_events     : {ae:>8,}")
        print(f"  mango_missions         : {mc:>8}")
        print("─────────────────────────────────────────────────────────────────────────")
        print("\nDone. Dashboard history and Grafana panels are now populated.\n")


if __name__ == "__main__":
    run()
