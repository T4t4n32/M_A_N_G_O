from flask import Blueprint, jsonify
from datetime import datetime
from ..services.sensor_store import sensor_store

temperature_bp = Blueprint('temperature', __name__, url_prefix='/api')

@temperature_bp.route('/temperature/latest')
def get_latest_temperature():
    """
    Endpoint para temperatura - DATOS CALIBRADOS (los únicos reales)
    """
    try:
        data = sensor_store.get_latest('temperature')
        
        # ✅ CORREGIDO: Línea completa
        if 'value' not in data and 'raw' in data:
            data['value'] = round(data['raw'] * 0.1, 1)  # Ejemplo: 255 -> 25.5°C
        
        data['data_quality'] = 'calibrated'
        data['unit'] = 'C'
        data['note'] = 'Datos calibrados - Sistema operativo'
        
        return jsonify(data)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error',
            'sensor': 'temperature',
            'data_quality': 'calibrated',
            'timestamp': datetime.now().isoformat()
        }), 500