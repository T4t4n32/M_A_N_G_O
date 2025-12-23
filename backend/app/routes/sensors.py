from flask import Blueprint, jsonify
from app.services.data_ingestion import get_latest_turbidity, update_turbidity

sensors_bp = Blueprint("sensors", __name__)

# Endpoint para el dashboard
@sensors_bp.route("/api/turbidity/latest", methods=["GET"])
def turbidity_latest():
    data = get_latest_turbidity()
    if data["value"] is None:
        return jsonify({"error": "no data yet"}), 404
    return jsonify(data)

# Endpoint temporal para simular ingreso de datos
# (luego se reemplaza por lectura serial real)
@sensors_bp.route("/api/turbidity/mock/<float:value>", methods=["POST"])
def turbidity_mock(value):
    update_turbidity(value)
    return jsonify({"status": "ok", "value": value})
