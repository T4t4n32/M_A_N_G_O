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
        
        # ✅ ASEGURA QUE SIEMPRE MUESTRE DATOS CRUDOS CON VOLTAJE
        if 'voltage' not in data:
            # Calcula voltaje si no está presente (backwards compatibility)
            raw_value = data.get('raw', 0)
            data['voltage'] = round(raw_value * 5.0 / 1023, 3)
        
        # ✅ ETIQUETA CLARA DE QUE ES DATO CRUDO
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

@ph_bp.route('/temperature/latest')
def get_latest_temperature():
    """
    Endpoint para temperatura - DATOS CALIBRADOS (los únicos reales)
    """
    try:
        data = sensor_store.get_latest('temperature')
        
        # ✅ ASEGURA QUE MUESTRE VALOR CALIBRADO
        if 'value' not in data and 'raw' in data:
            # Conversión básica si no hay valor calibrado
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

@ph_bp.route('/turbidity/latest')
def get_latest_turbidity():
    """
    Endpoint para turbidez - DATOS CRUDOS SIN CALIBRAR
    """
    try:
        data = sensor_store.get_latest('turbidity')
        
        # ✅ ETIQUETA CLARA DE QUE ES DATO CRUDO
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

@ph_bp.route('/status')
def system_status():
    """Endpoint para verificar el estado del sistema"""
    return jsonify({
        'backend': 'online',
        'sensors_status': {
            'ph': {
                'quality': 'raw_uncalibrated',
                'note': 'Muestra voltaje crudo sin calibrar'
            },
            'temperature': {
                'quality': 'calibrated', 
                'note': 'Único sensor con datos calibrados'
            },
            'turbidity': {
                'quality': 'raw_uncalibrated',
                'note': 'Muestra valor ADC crudo sin calibrar'
            }
        },
        'timestamp': datetime.now().isoformat()
    })