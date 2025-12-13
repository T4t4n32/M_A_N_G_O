from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__, url_prefix="/api")

@health_bp.route("/health")
def health():
    return jsonify({"status": "ok"})
