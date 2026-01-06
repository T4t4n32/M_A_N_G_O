from flask import Blueprint, jsonify

ph_bp = Blueprint("ph", __name__)

LATEST_PH = {
    "raw_voltage": None,
    "timestamp": None
}

@ph_bp.route("/ph/latest", methods=["GET"])
def get_latest_ph():
    return jsonify({
        "sensor": "pH",
        "value": LATEST_PH["raw_voltage"],
        "unit": "V",
        "status": "raw-unfiltered"
    })
