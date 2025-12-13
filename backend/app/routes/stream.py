from flask import Blueprint, session, Response, jsonify
from datetime import datetime
import json
import time
import random

stream_bp = Blueprint("stream", __name__)

@stream_bp.route("/stream")
def stream():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    def generate():
        while True:
            payload = {
                "timestamp": datetime.utcnow().isoformat(),
                "temperature": round(random.uniform(24.0, 30.0), 2),
                "ph": round(random.uniform(6.5, 8.5), 2),
                "turbidity": round(random.uniform(0.0, 100.0), 2)
            }
            yield f"data: {json.dumps(payload)}\n\n"
            time.sleep(5)

    return Response(generate(), mimetype="text/event-stream")
