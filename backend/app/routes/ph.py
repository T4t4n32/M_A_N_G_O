from flask import Blueprint, jsonify
from datetime import datetime
from ..services.sensor_store import sensor_store

ph_bp = Blueprint('ph', __name__, url_prefix='/api')

@ph_bp.route('/ph/latest')
def get_latest_ph():
    """
    Endpoint para obtener el último valor de pH
    ¡DEVUELVE DATOS CRUDOS (VOLTAJE) SIN CALIBRAR!
    """
    try:
        data = sensor_store.get_latest('ph')
        
        # ✅ CORREGIDO: Línea completa
        if 'voltage' not in data:
            raw_value = data.get('raw', 0)
            data['voltage'] = round(raw_value * 5.0 / 1023, 3)
        
        # Etiqueta clara de que es dato crudo
        data['data_quality'] = 'raw_uncalibrated'
        data['unit'] = 'volt'
        data['note'] = 'Datos crudos sin calibrar - Solo para pruebas'
        
        return jsonify(data)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error',
            'sensor': 'ph',
            'data_quality': 'raw_uncalibrated',
            'timestamp': datetime.now().isoformat()
        }), 500