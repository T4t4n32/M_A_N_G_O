# backend/app/routes/health.py
"""
Rutas para monitoreo de salud del sistema
"""
from flask import Blueprint, jsonify
from datetime import datetime
from ..services.sensor_store import sensor_store

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint para verificar estado del sistema
    """
    try:
        connection_status = sensor_store.get_connection_status()
        sensors_connected = sum(1 for status in connection_status.values() if status == 'online')
        
        return jsonify({
            'status': 'ok',
            'service': 'mango-monitoring',
            'version': '1.0.0',
            'timestamp': datetime.now().isoformat(),
            'environment': 'production' if not __debug__ else 'development',
            'sensors': {
                'total': 3,
                'connected': sensors_connected,
                'status': connection_status
            },
            'database': 'connected',  # EN PRODUCCIÓN: verificar conexión real
            'backend': 'running'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@health_bp.route('/status', methods=['GET'])
def system_status():
    """
    Estado completo del sistema con métricas
    """
    try:
        connection_status = sensor_store.get_connection_status()
        sensors_connected = sum(1 for status in connection_status.values() if status == 'online')
        
        # Calcular uptime (simulado)
        uptime = '00:00:00'
        
        return jsonify({
            'system_status': 'operational',
            'timestamp': datetime.now().isoformat(),
            'uptime': uptime,
            'environment': 'production' if not __debug__ else 'development',
            'components': {
                'sensors': {
                    'total': 3,
                    'connected': sensors_connected,
                    'status': connection_status,
                    'types': ['ph', 'temperature', 'turbidity']
                },
                'database': {
                    'status': 'operational',
                    'type': 'postgresql',
                    'version': '15.x'
                },
                'backend': {
                    'status': 'running',
                    'framework': 'Flask 3.0.0',
                    'python_version': '3.11.x'
                }
            },
            'metrics': {
                'active_sessions': 1,  # Simulado
                'requests_total': 150,  # Simulado
                'memory_usage_mb': 120  # Simulado
            }
        }), 200
    except Exception as e:
        return jsonify({
            'system_status': 'critical',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500