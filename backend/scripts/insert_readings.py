import sqlite3
from pathlib import Path
from datetime import datetime, timezone
import random
import argparse

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "mango.db"
print("DB_PATH =", DB_PATH)

SENSOR_RANGES = {
    "ph": (1.0, 12.0),
    "temperature": (-5.0, 60.0),
    "turbidity": (0.0, 4000.0)
}

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def get_sensor_ids(conn):
    cur = conn.cursor()
    rows = cur.execute("SELECT id, type FROM sensors WHERE is_active = 1").fetchall()
    return {t: i for (i, t) in rows}


def insert_reading(conn, sensor_id, value, is_valid, recorded_at):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO sensor_readings (sensor_id, value, is_valid, recorded_at)
        VALUES (?, ?, ?, ?)
    """, (sensor_id, float(value), int(is_valid), recorded_at))
    conn.commit()


def set_sensor_status(conn, sensor_id, status, message):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO sensor_status (sensor_id, status, message, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(sensor_id) DO UPDATE SET
            status=excluded.status,
            message=excluded.message,
            updated_at=CURRENT_TIMESTAMP
    """, (sensor_id, status, message))
    conn.commit()


def generate_value(sensor_type, make_invalid=False):
    low, high = SENSOR_RANGES[sensor_type]

    if not make_invalid:
        # valor dentro de rango (válido)
        if sensor_type == "ph":
            return round(random.uniform(6.5, 8.5), 2)
        if sensor_type == "temperature":
            return round(random.uniform(22.0, 30.0), 2)
        if sensor_type == "turbidity":
            return round(random.uniform(0.5, 15.0), 2)
        return round(random.uniform(low, high), 2)

    # valor fuera de rango (inválido)
    # hacemos algo claramente incorrecto
    if random.random() < 0.5:
        return round(low - random.uniform(1.0, 10.0), 2)
    return round(high + random.uniform(1.0, 200.0), 2)


def main():
    parser = argparse.ArgumentParser(description="Inserta lecturas en SQLite para M.A.N.G.O.")
    parser.add_argument("--count", type=int, default=1, help="Número de lecturas por sensor (default 1)")
    parser.add_argument("--invalid-rate", type=float, default=0.0, help="Probabilidad de insertar valores inválidos (0.0 a 1.0)")
    parser.add_argument("--maintenance", action="store_true", help="Pone sensores con fallos en mantenimiento")
    args = parser.parse_args()

    if not DB_PATH.exists():
        raise FileNotFoundError(f"No existe la DB en: {DB_PATH}. Ejecuta primero scripts/init_db.py")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    sensor_ids = get_sensor_ids(conn)

    missing = [s for s in ["ph", "temperature", "turbidity"] if s not in sensor_ids]
    if missing:
        raise RuntimeError(f"Faltan sensores en DB: {missing}. Revisa init_db.py")

    total_inserted = 0
    any_invalid = {"ph": False, "temperature": False, "turbidity": False}

    for _ in range(args.count):
        timestamp = utc_now_iso()

        for sensor_type in ["ph", "temperature", "turbidity"]:
            make_invalid = random.random() < args.invalid_rate
            value = generate_value(sensor_type, make_invalid=make_invalid)

            # regla de validez por rangos
            low, high = SENSOR_RANGES[sensor_type]
            is_valid = (low <= value <= high)

            insert_reading(conn, sensor_ids[sensor_type], value, is_valid, timestamp)
            total_inserted += 1

            if not is_valid:
                any_invalid[sensor_type] = True

    # Estados de sensores
    for sensor_type in ["ph", "temperature", "turbidity"]:
        sid = sensor_ids[sensor_type]

        if any_invalid[sensor_type]:
            if args.maintenance:
                set_sensor_status(conn, sid, "maintenance",
                                  "Lecturas fuera de rango detectadas. Revisar calibración/montaje.")
            else:
                set_sensor_status(conn, sid, "ok",
                                  "Sensor operativo (con lecturas fuera de rango registradas).")
        else:
            set_sensor_status(conn, sid, "ok", "Sensor operativo")

    conn.close()

    print(f"✅ Insertadas {total_inserted} lecturas en total ({args.count} por sensor).")
    print("Sugerencia: prueba /api/latest y /api/history?limit=50")


if __name__ == "__main__":
    main()
