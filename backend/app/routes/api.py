# backend/app/routes/api.py
from __future__ import annotations

from flask import Blueprint, jsonify, request, current_app

from app.services.data_service import ingest_payload, latest_rows

bp = Blueprint("api", __name__, url_prefix="/api/v1")


@bp.get("/latest")
def latest():
    station = request.args.get("station") or None
    limit_raw = request.args.get("limit", "200")

    try:
        limit = int(limit_raw)
    except Exception:
        limit = 200

    max_limit = int(current_app.config.get("MAX_LATEST_LIMIT", 2000))
    limit = max(1, min(limit, max_limit))

    return jsonify(latest_rows(station_name=station, limit=limit))


@bp.post("/ingest")
def ingest():
    if not request.is_json:
        return jsonify({"ok": False, "error": "expected_json"}), 400

    payload = request.get_json(silent=True) or {}
    result = ingest_payload(payload)
    status = 200 if result.get("ok") else 400
    return jsonify(result), status
