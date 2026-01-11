from flask import Blueprint, jsonify
from datetime import datetime
from ..services.sensor_store import sensor_store

historical_bp = Blueprint('historical', __name__, url_prefix='/api/historical')

@historical_bp.route('/latest')
def get_latest_historical_data():
    """
    Endpoint para obtener los últimos datos históricos de todos los sensores
    NO genera datos simulados - devuelve error 404 si no hay datos reales
    """
    try:
        result = {}
        has_any_data = False
        
        # Verificar datos históricos para cada sensor
        for sensor_type in ['ph', 'temperature', 'turbidity']:
            # Obtener datos históricos reales (no simulados)
            historical_data = sensor_store.get_historical_data(sensor_type, limit=1)
            
            if historical_data and len(historical_data) > 0:
                has_any_data = True
                last_record = historical_data[0]
                
                # Formatear datos para el frontend
                formatted_data = {
                    'value': last_record.get('value', last_record.get('raw', 0)),
                    'timestamp': last_record.get('timestamp', last_record.get('received_at')),
                    'source': 'historical_database',
                    'quality': last_record.get('data_quality', 'historical'),
                    'raw_value': last_record.get('raw', None),
                    'notes': last_record.get('notes', 'Dato histórico real')
                }
                result[sensor_type] = formatted_data
        
        # Si no hay ningún dato histórico
        if not has_any_data:
            return jsonify({
                'message': 'No hay mediciones históricas disponibles',
                'exploration_status': 'not_performed',
                'reason': 'No se han realizado mediciones en el manglar',
                'recommendation': 'Contacte al administrador para realizar la primera exploración',
                'timestamp': datetime.now().isoformat()
            }), 404
        
        # Si hay datos, devolverlos con metadatos
        result['exploration_status'] = 'performed'
        result['data_count'] = len(result) - 1  # -1 porque exploration_status no cuenta
        result['timestamp'] = datetime.now().isoformat()
        result['message'] = 'Datos históricos recuperados exitosamente'
        
        return jsonify(result)
        
    except Exception as e:
        error_message = f"Error obteniendo datos históricos: {str(e)}"
        print(f"🔥 {error_message}")  # Log en servidor
        return jsonify({
            'error': str(e),
            'exploration_status': 'error',
            'message': error_message,
            'timestamp': datetime.now().isoformat()
        }), 500

@historical_bp.route('/status')
def historical_status():
    """
    Verifica si hay datos históricos disponibles sin devolver los datos mismos
    """
    try:
        has_data = False
        sensors_with_data = []
        
        for sensor_type in ['ph', 'temperature', 'turbidity']:
            count = sensor_store.get_historical_count(sensor_type)
            if count > 0:
                has_data = True
                sensors_with_data.append({
                    'sensor': sensor_type,
                    'count': count,
                    'last_update': sensor_store.get_last_historical_update(sensor_type)
                })
        
        status = "performed" if has_data else "not_performed"
        message = "Exploración realizada - datos históricos disponibles" if has_data else "No hay mediciones previas - Exploración no realizada"
        
        return jsonify({
            'status': status,
            'message': message,
            'has_historical_data': has_data,
            'sensors_with_data': sensors_with_data,
            'total_sensors': len(sensors_with_data),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error verificando estado histórico: {str(e)}',
            'has_historical_data': False,
            'timestamp': datetime.now().isoformat()
        }), 500