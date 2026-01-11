from flask import Blueprint, jsonify
from datetime import datetime
import time
import platform

health_bp = Blueprint('health', __name__, url_prefix='/api')

@health_bp.route('/health')
def health_check():
    """
    Endpoint de salud del sistema - Verifica componentes críticos
    """
    start_time = time.time()
    
    try:
        # Verificar estado de los componentes
        components = {}
        
        # 1. Verificar sensor_store
        from ..services.sensor_store import sensor_store
        components['sensor_store'] = {
            'status': 'operational',
            'has_data': bool(sensor_store._data or sensor_store._raw_data),
            'sensors': list(sensor_store._data.keys()) if sensor_store._data else [],
            'last_update': max(sensor_store.last_update.values()) if sensor_store.last_update else None
        }
        
        # 2. Verificar conexión con base de datos (simulada por ahora)
        try:
            # En producción: aquí iría la verificación real de la BD
            db_status = 'operational'
            db_message = 'Base de datos conectada (simulada)'
        except Exception as e:
            db_status = 'degraded'
            db_message = f'Error de conexión: {str(e)}'
        
        components['database'] = {
            'status': db_status,
            'message': db_message,
            'type': 'simulated'  # En producción: 'sqlite', 'postgresql', etc.
        }
        
        # 3. Verificar autenticación
        components['authentication'] = {
            'status': 'operational',
            'method': 'session_cookies',
            'cors_enabled': True
        }
        
        # Calcular tiempo de respuesta
        response_time = time.time() - start_time
        
        # Determinar estado general
        all_operational = all(comp['status'] == 'operational' for comp in components.values())
        overall_status = 'healthy' if all_operational else 'degraded'
        
        return jsonify({
            'status': 'online',
            'system_status': overall_status,
            'timestamp': datetime.now().isoformat(),
            'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'environment': 'development',
            'version': '1.1.0',
            'response_time_ms': round(response_time * 1000, 2),
            'components': components,
            'system_info': {
                'python_version': platform.python_version(),
                'flask_version': '2.3.3',  # Ajustar según versión real
                'platform': platform.platform(),
                'uptime': '00:00:00'  # Para implementar en producción
            },
            'recommendations': [
                'Ejecutar exploración del manglar para obtener datos históricos',
                'Calibrar sensores para mediciones precisas'
            ] if overall_status != 'healthy' else []
        })
        
    except Exception as e:
        error_time = time.time() - start_time
        return jsonify({
            'status': 'offline',
            'system_status': 'critical',
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
            'response_time_ms': round(error_time * 1000, 2),
            'message': 'El sistema presenta fallos críticos - contacte al administrador',
            'emergency_contact': 'admin@mango-system.local'
        }), 503

@health_bp.route('/ping')
def ping():
    """
    Endpoint simple para verificar conexión básica
    """
    return jsonify({
        'pong': True,
        'timestamp': datetime.now().isoformat(),
        'message': 'Sistema respondiendo correctamente'
    })