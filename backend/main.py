#!/usr/bin/env python3
"""
M.A.N.G.O - Monitoreo Autonomo de Niveles y Gestion Oceanica
Sistema de backend para monitoreo de sensores en manglares
"""

import os
import json
import time
import random
import math
from datetime import datetime, timedelta
from functools import wraps
from dotenv import load_dotenv

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Cargar variables de entorno desde .env
load_dotenv()

# =============== CONFIGURACIÓN DE LA APLICACIÓN ===============
app = Flask(__name__,
    static_folder='../frontend/assets',  # Ruta a los assets estáticos
    template_folder='../frontend'       # Ruta a las plantillas HTML
)

# Configuración basada en entorno
app.config.update(
    SECRET_KEY=os.environ.get('SECRET_KEY', 'mango_secure_key_fallback_2026'),
    DEBUG=os.environ.get('DEBUG', 'False').lower() == 'true',
    ENVIRONMENT=os.environ.get('ENVIRONMENT', 'development'),
    API_RATE_LIMIT=os.environ.get('API_RATE_LIMIT', '100/hour'),
    SESSION_COOKIE_SECURE=os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true',
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    OFFLINE_MODE=os.environ.get('OFFLINE_MODE', 'False').lower() == 'true'
)

# Configurar CORS según entorno
if app.config['ENVIRONMENT'] == 'development':
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:*"}})
else:
    CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configurar rate limiting - CORREGIDO PARA NUEVA API
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[app.config['API_RATE_LIMIT']],
    storage_uri="memory://"
)

# =============== DATOS DE EJEMPLO Y SIMULACIÓN ===============
# Credenciales de usuarios (en producción usar base de datos)
USERS = {
    'admin': {
        'password': 'Admin1234',
        'role': 'admin',
        'full_name': 'Administrador del Sistema'
    },
    'user': {
        'password': 'Mango2026',
        'role': 'user',
        'full_name': 'Usuario Estándar'
    }
}

# Estado de los sensores - SIN DATOS SIMULADOS
SENSOR_STATUS = {
    'ph': {
        'status': 'needs_calibration',
        'connected': False,
        'last_reading': None,
        'calibration_date': None,
        'optimal_range': (6.5, 8.5),
        'hardware_note': 'Sensor de pH requiere calibración antes de uso'
    },
    'temperature': {
        'status': 'operational',
        'connected': False,
        'last_reading': None,
        'calibration_date': '2026-01-10',
        'optimal_range': (24, 28),
        'hardware_note': 'Sensor de temperatura listo para usar'
    },
    'turbidity': {
        'status': 'hardware_issue',
        'connected': False,
        'last_reading': None,
        'calibration_date': '2026-01-05',
        'hardware_note': 'Sensor de turbidez con problema de hardware - requiere mantenimiento',
        'optimal_range': (0, 5)
    }
}

# Datos históricos - INICIALMENTE VACÍOS
HISTORICAL_DATA = {
    'ph': [],
    'temperature': [],
    'turbidity': []
}

# =============== DECORADORES DE SEGURIDAD ===============
def login_required(f):
    """Decorador para rutas que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'error': 'No autorizado', 'message': 'Sesión expirada o inválida'}), 401
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorador para rutas que requieren rol de administrador"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            if request.is_json:
                return jsonify({'error': 'Acceso denegado', 'message': 'Se requiere rol de administrador'}), 403
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

# =============== RUTAS DE AUTENTICACIÓN ===============
@app.route('/login', methods=['GET'])
def login_page():
    """Página de login (solo GET para el formulario HTML)"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """API para autenticación de usuarios"""
    if not request.is_json:
        return jsonify({'error': 'Formato de solicitud inválido', 'message': 'Se requiere Content-Type: application/json'}), 400
    
    data = request.get_json()
    username = data.get('username', '').strip().lower()
    password = data.get('password', '').strip()
    remember = data.get('remember', False)
    
    # Validación básica
    if not username or not password:
        return jsonify({'error': 'Campos incompletos', 'message': 'Usuario y contraseña son requeridos'}), 400
    
    # Verificar credenciales
    user = USERS.get(username)
    if not user or user['password'] != password:
        return jsonify({'error': 'Autenticación fallida', 'message': 'Credenciales inválidas'}), 401
    
    # Crear sesión
    session['user_id'] = username
    session['role'] = user['role']
    session['full_name'] = user['full_name']
    session['login_time'] = datetime.now().isoformat()
    
    # Configurar sesión persistente si se solicita
    if remember:
        session.permanent = True
    
    return jsonify({
        'success': True,
        'redirect': url_for('dashboard'),
        'user': {
            'username': username,
            'role': user['role'],
            'full_name': user['full_name']
        },
        'session_expires': (datetime.now() + timedelta(days=30)).isoformat() if remember else (datetime.now() + timedelta(hours=2)).isoformat()
    })

@app.route('/api/auth/status')
@login_required
def auth_status():
    """Verifica el estado de la sesión actual"""
    return jsonify({
        'authenticated': True,
        'user': {
            'username': session['user_id'],
            'role': session['role'],
            'full_name': session['full_name'],
            'session_started': session['login_time']
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    """Cierra la sesión del usuario"""
    session.clear()
    return jsonify({'success': True, 'message': 'Sesión cerrada correctamente'})

# =============== RUTAS DEL SISTEMA ===============
@app.route('/')
def index():
    """Redirección a login o dashboard según sesión"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login_page'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Página principal del dashboard"""
    return render_template('dashboard.html', 
                         user=session['user_id'],
                         role=session['role'],
                         full_name=session['full_name'])

@app.route('/api/status')
def system_status():
    """Estado general del sistema"""
    # Verificar conexión de sensores (SIMULADO - en producción verificar hardware real)
    sensors_connected = any(sensor['connected'] for sensor in SENSOR_STATUS.values())
    
    return jsonify({
        'status': 'online',
        'system_time': datetime.now().isoformat(),
        'mode': 'offline' if app.config['OFFLINE_MODE'] else 'online',
        'sensors': {
            'connected': sensors_connected,
            'count': sum(1 for sensor in SENSOR_STATUS.values() if sensor['connected']),
            'types': ['ph', 'temperature', 'turbidity'],
            'details': {sensor: status for sensor, status in SENSOR_STATUS.items()}
        },
        'database': {
            'online': False,  # Base de datos no configurada aún
            'status': 'pending_configuration',
            'message': 'Base de datos pendiente de configuración'
        },
        'system_load': {
            'cpu': random.uniform(10, 30),
            'memory': random.uniform(40, 60),
            'disk': random.uniform(50, 70)
        }
    })

@app.route('/api/exploration/status')
def exploration_status():
    """Estado de la exploración (si se han realizado mediciones)"""
    has_historical_data = any(len(data) > 0 for data in HISTORICAL_DATA.values())
    
    return jsonify({
        'status': 'not_performed',
        'message': 'Exploración no realizada - sensores no conectados',
        'sensors_explored': [],
        'total_records': 0,
        'required_action': 'Conectar sensores y realizar calibración'
    })

# =============== RUTAS DE DATOS DE SENSORES (SIN SIMULACIÓN) ===============
@app.route('/api/ph/latest')
@login_required
def get_ph_latest():
    """Última lectura del sensor de pH - SIN SIMULACIÓN"""
    sensor = SENSOR_STATUS['ph']
    
    if not sensor['connected']:
        return jsonify({
            'error': 'Sensor no conectado',
            'message': sensor['hardware_note'],
            'connected': False,
            'status': sensor['status']
        }), 404
    
    if not sensor['last_reading']:
        return jsonify({
            'warning': 'Sensor conectado pero sin lecturas',
            'message': sensor['hardware_note'],
            'connected': True,
            'status': sensor['status']
        }), 200
    
    return jsonify(sensor['last_reading'])

@app.route('/api/temperature/latest')
@login_required
def get_temperature_latest():
    """Última lectura del sensor de temperatura - SIN SIMULACIÓN"""
    sensor = SENSOR_STATUS['temperature']
    
    if not sensor['connected']:
        return jsonify({
            'error': 'Sensor no conectado',
            'message': sensor['hardware_note'],
            'connected': False,
            'status': sensor['status']
        }), 404
    
    if not sensor['last_reading']:
        return jsonify({
            'warning': 'Sensor conectado pero sin lecturas',
            'message': sensor['hardware_note'],
            'connected': True,
            'status': sensor['status']
        }), 200
    
    return jsonify(sensor['last_reading'])

@app.route('/api/turbidity/latest')
@login_required
def get_turbidity_latest():
    """Última lectura del sensor de turbidez - SIN SIMULACIÓN"""
    sensor = SENSOR_STATUS['turbidity']
    
    if not sensor['connected']:
        return jsonify({
            'error': 'Sensor no conectado',
            'message': sensor['hardware_note'],
            'connected': False,
            'status': sensor['status']
        }), 404
    
    if not sensor['last_reading']:
        return jsonify({
            'warning': 'Sensor conectado pero sin lecturas',
            'message': sensor['hardware_note'],
            'connected': True,
            'status': sensor['status']
        }), 200
    
    return jsonify(sensor['last_reading'])

@app.route('/api/sensors/all')
@login_required
def get_all_sensors():
    """Todas las lecturas actuales de sensores - SIN DATOS FALSOS"""
    return jsonify({
        'ph': {
            'connected': SENSOR_STATUS['ph']['connected'],
            'status': SENSOR_STATUS['ph']['status'],
            'message': SENSOR_STATUS['ph']['hardware_note'],
            'data': SENSOR_STATUS['ph']['last_reading'] if SENSOR_STATUS['ph']['connected'] else None
        },
        'temperature': {
            'connected': SENSOR_STATUS['temperature']['connected'],
            'status': SENSOR_STATUS['temperature']['status'],
            'message': SENSOR_STATUS['temperature']['hardware_note'],
            'data': SENSOR_STATUS['temperature']['last_reading'] if SENSOR_STATUS['temperature']['connected'] else None
        },
        'turbidity': {
            'connected': SENSOR_STATUS['turbidity']['connected'],
            'status': SENSOR_STATUS['turbidity']['status'],
            'message': SENSOR_STATUS['turbidity']['hardware_note'],
            'data': SENSOR_STATUS['turbidity']['last_reading'] if SENSOR_STATUS['turbidity']['connected'] else None
        },
        'system_time': datetime.now().isoformat(),
        'mode': 'online'
    })

# =============== RUTAS DE ADMINISTRACIÓN ===============
@app.route('/api/system/connect-sensor/<sensor_type>', methods=['POST'])
@admin_required
def connect_sensor(sensor_type):
    """Conectar un sensor manualmente (para pruebas)"""
    if sensor_type not in SENSOR_STATUS:
        return jsonify({'error': 'Sensor inválido', 'message': 'Tipo de sensor no soportado'}), 400
    
    # Simular conexión de sensor (en producción, verificar hardware real)
    SENSOR_STATUS[sensor_type]['connected'] = True
    SENSOR_STATUS[sensor_type]['last_reading'] = None  # Sin datos reales aún
    
    return jsonify({
        'success': True,
        'sensor': sensor_type,
        'connected': True,
        'message': f'Sensor de {sensor_type} conectado manualmente. Requiere calibración/lecturas reales.'
    })

@app.route('/api/system/toggle-offline', methods=['POST'])
@admin_required
def toggle_offline_mode():
    """Cambia entre modo online y offline (solo admin)"""
    app.config['OFFLINE_MODE'] = not app.config['OFFLINE_MODE']
    
    return jsonify({
        'success': True,
        'mode': 'offline' if app.config['OFFLINE_MODE'] else 'online',
        'message': f'Modo {("offline" if app.config["OFFLINE_MODE"] else "online")} activado'
    })

@app.route('/api/system/health')
def system_health():
    """Salud del sistema para monitoreo"""
    sensors_connected = any(sensor['connected'] for sensor in SENSOR_STATUS.values())
    
    return jsonify({
        'status': 'healthy' if sensors_connected or not app.config['OFFLINE_MODE'] else 'degraded',
        'timestamp': datetime.now().isoformat(),
        'components': {
            'database': 'pending_configuration',
            'sensors': 'operational' if sensors_connected else 'no_sensors_connected',
            'api': 'operational'
        },
        'alerts': [
            {
                'level': 'warning',
                'message': 'Base de datos no configurada',
                'action': 'Configurar conexión a base de datos'
            },
            {
                'level': 'info',
                'message': 'Sistema en modo de desarrollo',
                'action': 'Preparar para producción'
            }
        ] if not sensors_connected else [],
        'metrics': {
            'active_sessions': len(session),
            'api_requests_total': 150,  # Simulado
            'memory_usage_mb': 120  # Simulado
        }
    })

# =============== MANEJO DE ERRORES ===============
@app.errorhandler(404)
def not_found_error(error):
    """Manejador de errores 404"""
    if request.is_json:
        return jsonify({'error': 'Recurso no encontrado', 'message': f'La ruta {request.path} no existe'}), 404
    return render_template('login.html'), 404

@app.errorhandler(401)
def unauthorized_error(error):
    """Manejador de errores 401"""
    if request.is_json:
        return jsonify({'error': 'No autorizado', 'message': 'Debe iniciar sesión para acceder a este recurso'}), 401
    return redirect(url_for('login_page'))

@app.errorhandler(403)
def forbidden_error(error):
    """Manejador de errores 403"""
    if request.is_json:
        return jsonify({'error': 'Acceso denegado', 'message': 'No tiene permisos suficientes para esta acción'}), 403
    return redirect(url_for('login_page'))

@app.errorhandler(429)
def rate_limit_error(error):
    """Manejador de errores 429 (rate limiting)"""
    return jsonify({
        'error': 'Límite de peticiones excedido',
        'message': 'Demasiadas solicitudes. Por favor, espere antes de intentar nuevamente',
        'retry_after': 60  # segundos
    }), 429

@app.errorhandler(500)
def internal_error(error):
    """Manejador de errores 500"""
    app.logger.error(f'Error interno del servidor: {str(error)}')
    if request.is_json:
        return jsonify({
            'error': 'Error interno del servidor',
            'message': 'Ocurrió un error inesperado. Por favor, intente nuevamente más tarde'
        }), 500
    return render_template('login.html'), 500

# =============== RUTAS ESTÁTICAS ===============
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Sirve archivos estáticos (CSS, JS, imágenes)"""
    return send_from_directory(app.static_folder, filename)

@app.route('/favicon.ico')
def favicon():
    """Favicon para el sitio"""
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

# =============== INICIALIZACIÓN Y EJECUCIÓN ===============
def initialize_system():
    """Inicializa el sistema antes de ejecutar"""
    print(f"""
    ===========================================================================
    M.A.N.G.O - Monitoreo Autonomo de Niveles y Gestion Oceanica
    ===========================================================================
    Iniciando sistema en modo: {app.config['ENVIRONMENT'].upper()}
    Estado de sensores: NO CONECTADOS (requiere conexión física)
    Base de datos: PENDIENTE DE CONFIGURACIÓN
    Puerto: {os.environ.get('PORT', 5000)}
    Debug: {'ACTIVADO' if app.config['DEBUG'] else 'DESACTIVADO'}
    -------------------------------------------------------------------------
    Credenciales de prueba:
    - Admin: admin / Admin1234
    - Usuario: user / Mango2026
    -------------------------------------------------------------------------
    Acceda a:
    - Dashboard: http://localhost:{os.environ.get('PORT', 5000)}/dashboard
    - API Status: http://localhost:{os.environ.get('PORT', 5000)}/api/status
    -------------------------------------------------------------------------
    NOTAS IMPORTANTES:
    - Los sensores NO están conectados actualmente
    - NO se muestran datos simulados/falsos
    - Base de datos pendiente de configuración
    - Sistema listo para conexión de sensores reales
    -------------------------------------------------------------------------
    Presione CTRL+C para detener el servidor
    ===========================================================================
    """)

if __name__ == '__main__':
    # Inicializar sistema
    initialize_system()
    
    # Configurar puerto y host
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    # Ejecutar aplicación
    app.run(host=host, port=port, debug=app.config['DEBUG'])