# backend/app/routes/health.py
from flask import Blueprint, jsonify
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar estado del sistema"""
    return jsonify({
        'status': 'ok',
        'service': 'mango-monitoring',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@health_bp.route('/status', methods=['GET'])
def system_status():
    """Estado completo del sistema"""
    from ..services.sensor_store import sensor_store
    
    connection_status = sensor_store.get_connection_status()
    sensors_connected = sum(1 for status in connection_status.values() if status == 'online')
    
    return jsonify({
        'status': 'operational',
        'timestamp': datetime.now().isoformat(),
        'sensors': {
            'total': 3,
            'connected': sensors_connected,
            'status': connection_status
        },
        'database': 'connected',  # EN PRODUCCIÓN: verificar conexión real
        'backend': 'running'
    })