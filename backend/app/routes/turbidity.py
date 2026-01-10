from flask import Blueprint, jsonify
from datetime import datetime
from ..services.sensor_store import sensor_store

# ✅ DEBE SER turbidity_bp (no turb_bp)
turbidity_bp = Blueprint('turbidity', __name__, url_prefix='/api')

@turbidity_bp.route('/turbidity/latest')
def range_turbidity():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    now = datetime.utcnow()
    data = []

    for i in range(24):
        data.append({
            "timestamp": (now - timedelta(hours=24 - i)).isoformat(),
            "value": round(random.uniform(0.0, 100.0), 2)
        })

    return jsonify(data)
