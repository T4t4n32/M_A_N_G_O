# backend/app/routes/historical.py
"""
Rutas para datos históricos
"""
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from ..services.historical_data import HistoricalDataService

historical_bp = Blueprint('historical', __name__)

@historical_bp.route('/latest', methods=['GET'])
def get_latest_historical():
    """
    Obtener los últimos datos históricos de todos los sensores
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        sensor_type = request.args.get('sensor_type', 'all')
        
        if sensor_type == 'all':
            # Obtener datos de todos los sensores
            results = {}
            for st in ['ph', 'temperature', 'turbidity']:
                data = HistoricalDataService.get_latest_readings(st, limit=limit)
                results[st] = data
            return jsonify({
                'data': results,
                'count': sum(len(v) for v in results.values()),
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            if sensor_type not in ['ph', 'temperature', 'turbidity']:
                return jsonify({
                    'error': 'Sensor no válido',
                    'message': 'Tipo de sensor debe ser: ph, temperature, turbidity o all',
                    'timestamp': datetime.now().isoformat()
                }), 400
            
            data = HistoricalDataService.get_latest_readings(sensor_type, limit=limit)
            return jsonify({
                'sensor_type': sensor_type,
                'data': data,
                'count': len(data),
                'timestamp': datetime.now().isoformat()
            }), 200
            
    except Exception as e:
        return jsonify({
            'error': 'Error interno del servidor',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@historical_bp.route('/range', methods=['GET'])
def get_historical_range():
    """
    Obtener datos históricos en un rango de tiempo
    Query params: start_time, end_time, sensor_type
    """
    try:
        start_time_str = request.args.get('start_time')
        end_time_str = request.args.get('end_time')
        sensor_type = request.args.get('sensor_type', 'all')
        
        if not start_time_str or not end_time_str:
            return jsonify({
                'error': 'Parámetros incompletos',
                'message': 'Se requieren start_time y end_time en formato ISO 8601',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        # Parsear fechas
        start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        
        # Validar rango
        if end_time <= start_time:
            return jsonify({
                'error': 'Rango de tiempo inválido',
                'message': 'end_time debe ser posterior a start_time',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        # Limitar rango máximo a 30 días
        if (end_time - start_time).days > 30:
            return jsonify({
                'error': 'Rango demasiado grande',
                'message': 'El rango máximo permitido es de 30 días',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        if sensor_type == 'all':
            results = {}
            for st in ['ph', 'temperature', 'turbidity']:
                data = HistoricalDataService.get_readings_by_range(st, start_time, end_time)
                results[st] = data
            return jsonify({
                'data': results,
                'range': {
                    'start': start_time.isoformat(),
                    'end': end_time.isoformat(),
                    'duration_hours': (end_time - start_time).total_seconds() / 3600
                },
                'count': sum(len(v) for v in results.values()),
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            if sensor_type not in ['ph', 'temperature', 'turbidity']:
                return jsonify({
                    'error': 'Sensor no válido',
                    'message': 'Tipo de sensor debe ser: ph, temperature, turbidity o all',
                    'timestamp': datetime.now().isoformat()
                }), 400
            
            data = HistoricalDataService.get_readings_by_range(sensor_type, start_time, end_time)
            return jsonify({
                'sensor_type': sensor_type,
                'data': data,
                'range': {
                    'start': start_time.isoformat(),
                    'end': end_time.isoformat(),
                    'duration_hours': (end_time - start_time).total_seconds() / 3600
                },
                'count': len(data),
                'timestamp': datetime.now().isoformat()
            }), 200
            
    except Exception as e:
        return jsonify({
            'error': 'Error interno del servidor',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500