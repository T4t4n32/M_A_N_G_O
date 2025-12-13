from flask import Blueprint, jsonify, session
from datetime import datetime, timedelta
import random

ph_bp = Blueprint("ph", __name__)

@ph_bp.route("/range/ph")
def range_ph():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    now = datetime.utcnow()
    data = []

    for i in range(24):
        data.append({
            "timestamp": (now - timedelta(hours=24 - i)).isoformat(),
            "value": round(random.uniform(6.5, 8.5), 2)
        })

    return jsonify(data)
