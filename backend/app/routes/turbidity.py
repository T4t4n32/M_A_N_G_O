from flask import Blueprint, jsonify
from datetime import datetime
from ..services.sensor_store import sensor_store

turbidity_bp = Blueprint('turbidity', __name__, url_prefix='/api')

@turbidity_bp.route('/turbidity/latest')
def get_latest_turbidity():
    """
    Endpoint para turbidez - DATOS CRUDOS SIN CALIBRAR
    """
    try:
        data = sensor_store.get_latest('turbidity')
        
        # Etiqueta clara de que es dato crudo
        data['data_quality'] = 'raw_uncalibrated'
        data['unit'] = 'raw_adc'
        data['note'] = 'Datos crudos sin calibrar - Solo para pruebas'
        
        return jsonify(data)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error',
            'sensor': 'turbidity',
            'data_quality': 'raw_uncalibrated',
            'timestamp': datetime.now().isoformat()
        }), 500