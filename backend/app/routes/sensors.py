# backend/app/routes/sensors.py
"""
Rutas para manejo de datos de sensores
"""
from flask import Blueprint, jsonify, request
from datetime import datetime
from ..services.sensor_store import sensor_store
from ..services.historical_data import HistoricalDataService

sensors_bp = Blueprint('sensors', __name__)

@sensors_bp.route('/all', methods=['GET'])
def get_all_sensors():
    """
    Obtener datos de todos los sensores (tiempo real o históricos)
    """
    try:
        results = {}
        sensors_connected = False
        last_update_times = {}
        
        # Verificar cada sensor
        for sensor_type in ['ph', 'temperature', 'turbidity']:
            latest = sensor_store.get_latest(sensor_type)
            
            if latest and latest.get('received_at'):
                # Convertir timestamp a datetime para comparación
                last_update = datetime.fromisoformat(latest['received_at'].replace('Z', '+00:00'))
                if (datetime.now(last_update.tzinfo) - last_update).total_seconds() < 300:  # Últimos 5 minutos
                    results[sensor_type] = latest
                    sensors_connected = True
                    last_update_times[sensor_type] = latest['received_at']
                else:
                    # Datos antiguos - usar datos históricos
                    historical = HistoricalDataService.get_latest_readings(sensor_type, limit=1)
                    results[sensor_type] = {
                        'historical': historical[0] if historical else None,
                        'status': 'offline',
                        'last_real_update': latest['received_at'],
                        'message': 'Sensor offline - Mostrando último dato histórico'
                    }
            else:
                # Sin datos en tiempo real - usar históricos
                historical = HistoricalDataService.get_latest_readings(sensor_type, limit=1)
                results[sensor_type] = {
                    'historical': historical[0] if historical else None,
                    'status': 'offline',
                    'message': 'Sensor no conectado - Mostrando datos históricos'
                }
        
        connection_status = sensor_store.get_connection_status()
        
        return jsonify({
            'status': 'online' if sensors_connected else 'offline',
            'data': results,
            'connection_status': connection_status,
            'last_updates': last_update_times,
            'system_time': datetime.now().isoformat(),
            'message': 'Datos en tiempo real' if sensors_connected else 'Sensores offline - Mostrando datos históricos'
        }), 200
        
    except Exception as e:
        print(f"Error fetching sensor data: {str(e)}")
        # Si hay error, mostrar datos históricos como fallback
        historical_data = HistoricalDataService.get_latest_readings('all', limit=10)
        return jsonify({
            'status': 'error',
            'data': historical_data,
            'error': str(e),
            'message': 'Error en sensores - Mostrando datos históricos de respaldo',
            'timestamp': datetime.now().isoformat()
        }), 500

@sensors_bp.route('/<sensor_type>/latest', methods=['GET'])
def get_sensor_latest(sensor_type):
    """
    Obtener el último dato de un sensor específico
    sensor_type: ph, temperature, turbidity
    """
    if sensor_type not in ['ph', 'temperature', 'turbidity']:
        return jsonify({
            'error': 'Sensor no válido',
            'message': 'Tipo de sensor debe ser: ph, temperature o turbidity',
            'timestamp': datetime.now().isoformat()
        }), 400
    
    try:
        latest = sensor_store.get_latest(sensor_type)
        
        if latest:
            return jsonify({
                'sensor_type': sensor_type,
                'data': latest,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            # Sin datos en tiempo real - buscar históricos
            historical = HistoricalDataService.get_latest_readings(sensor_type, limit=1)
            return jsonify({
                'sensor_type': sensor_type,
                'historical': historical[0] if historical else None,
                'status': 'no_data',
                'message': 'Sin datos en tiempo real - Mostrando datos históricos',
                'timestamp': datetime.now().isoformat()
            }), 200
            
    except Exception as e:
        return jsonify({
            'error': 'Error interno del servidor',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@sensors_bp.route('/status', methods=['GET'])
def get_sensors_status():
    """
    Obtener estado de conexión de todos los sensores
    """
    try:
        connection_status = sensor_store.get_connection_status()
        sensors_connected = sum(1 for status in connection_status.values() if status == 'online')
        
        return jsonify({
            'total_sensors': 3,
            'connected': sensors_connected,
            'status': connection_status,
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Error interno del servidor',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500