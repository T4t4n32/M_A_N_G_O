from flask import Blueprint, jsonify, request
from app import get_db_connection

api_bp = Blueprint("api", __name__)

# ==================================================
# /api/latest
# ==================================================
@api_bp.route("/latest", methods=["GET"])
def get_latest():

    conn = get_db_connection()
    cursor = conn.cursor()

    result = {}

    sensors = cursor.execute("""
        SELECT id, type, unit
        FROM sensors
        WHERE is_active = 1
    """).fetchall()

    for sensor in sensors:
        reading = cursor.execute("""
            SELECT value, is_valid, recorded_at
            FROM sensor_readings
            WHERE sensor_id = ?
            ORDER BY recorded_at DESC
            LIMIT 1
        """, (sensor["id"],)).fetchone()

        status = cursor.execute("""
            SELECT status, message
            FROM sensor_status
            WHERE sensor_id = ?
        """, (sensor["id"],)).fetchone()

        result[sensor["type"]] = {
            "value": reading["value"] if reading else None,
            "unit": sensor["unit"],
            "valid": bool(reading["is_valid"]) if reading else False,
            "timestamp": reading["recorded_at"] if reading else None,
            "status": status["status"] if status else "unknown",
            "message": status["message"] if status else ""
        }

    conn.close()
    return jsonify(result)


# ==================================================
# /api/history?limit=50
# ==================================================
@api_bp.route("/history", methods=["GET"])
def get_history():

    limit = int(request.args.get("limit", 50))
    limit = min(limit, 200)  # protección

    conn = get_db_connection()
    cursor = conn.cursor()

    rows = cursor.execute("""
        SELECT
            sr.value,
            sr.is_valid,
            sr.recorded_at,
            s.type,
            s.unit
        FROM sensor_readings sr
        JOIN sensors s ON sr.sensor_id = s.id
        ORDER BY sr.recorded_at DESC
        LIMIT ?
    """, (limit,)).fetchall()

    conn.close()

    history = []
    for r in rows:
        history.append({
            "type": r["type"],
            "value": r["value"],
            "unit": r["unit"],
            "valid": bool(r["is_valid"]),
            "timestamp": r["recorded_at"]
        })

    return jsonify(history)
