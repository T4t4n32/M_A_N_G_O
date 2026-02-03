import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "mango.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Crear tablas
cursor.executescript("""
CREATE TABLE IF NOT EXISTS sensors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    unit TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER NOT NULL,
    value REAL NOT NULL,
    is_valid BOOLEAN NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id)
);

CREATE TABLE IF NOT EXISTS sensor_status (
    sensor_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL,
    message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id)
);
""")

# Insertar sensores base si no existen
cursor.execute("SELECT COUNT(*) FROM sensors")
if cursor.fetchone()[0] == 0:
    sensors = [
        ("Sensor pH", "ph", "pH"),
        ("PT100 + MAX31865", "temperature", "°C"),
        ("Sensor Turbidez TSW-20M", "turbidity", "NTU")
    ]

    cursor.executemany(
        "INSERT INTO sensors (name, type, unit) VALUES (?, ?, ?)",
        sensors
    )

    # Estado inicial
    cursor.execute("SELECT id FROM sensors")
    for (sensor_id,) in cursor.fetchall():
        cursor.execute(
            "INSERT INTO sensor_status (sensor_id, status, message) VALUES (?, ?, ?)",
            (sensor_id, "ok", "Sensor operativo")
        )

conn.commit()
conn.close()

print("✅ Base de datos inicializada correctamente")
