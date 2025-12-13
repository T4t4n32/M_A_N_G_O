from flask import Blueprint, jsonify, session
from datetime import datetime, timedelta
import random

turbidity_bp = Blueprint("turbidity", __name__)

@turbidity_bp.route("/range/turbidity")
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
