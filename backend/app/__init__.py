from flask import Flask, session, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta

def create_app():
    app = Flask(__name__)
    
    # Configuración de secret key
    app.secret_key = 'mango_secret_key_2026'  # ¡Cambiar en producción!
    
    # Configuración de sesión - OPTIMIZADA
    app.config.update(
        SESSION_COOKIE_SECURE=False,  # False en desarrollo
        SESSION_COOKIE_HTTPONLY=False,  # False para frontend
        SESSION_COOKIE_SAMESITE='Lax',
        PERMANENT_SESSION_LIFETIME=timedelta(days=30)  # Sesiones más persistentes
    )
    
    # Configuración robusta de CORS - MEJORADA
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:7000", 
                "http://127.0.0.1:7000",
                "http://localhost:7001",  # Para posibles futuros puertos
                "http://127.0.0.1:7001"
            ],
            "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
            "allow_headers": [
                "Content-Type", 
                "Authorization", 
                "X-Requested-With",
                "Accept"
            ],
            "supports_credentials": True,
            "expose_headers": ["Set-Cookie", "Authorization"],
            "max_age": 86400  # 24 horas de caché para preflight
        }
    })
    
    # Importar blueprints - ¡AGREGADO HISTORICAL!
    from .routes.auth import auth_bp
    from .routes.ph import ph_bp
    from .routes.temperature import temperature_bp
    from .routes.turbidity import turbidity_bp
    from .routes.historical import historical_bp  # ¡NUEVO BLUEPRINT!
    from .routes.health import health_bp  # Para monitoreo de salud
    
    # Registrar blueprints - ¡REGISTRAR HISTORICAL!
    app.register_blueprint(auth_bp)
    app.register_blueprint(ph_bp)
    app.register_blueprint(temperature_bp)
    app.register_blueprint(turbidity_bp)
    app.register_blueprint(historical_bp)  # ¡REGISTRADO!
    app.register_blueprint(health_bp)
    
    # Ruta de bienvenida - MEJORADA
    @app.route('/')
    def welcome():
        return jsonify({
            'message': '🌿 M.A.N.G.O Backend API - Monitoreo de Manglares',
            'status': 'online',
            'version': '1.1.0',
            'endpoints': {
                'authentication': {
                    'login': '/api/auth/login',
                    'logout': '/api/auth/logout',
                    'status': '/api/auth/status'
                },
                'sensors': {
                    'ph_latest': '/api/ph/latest',
                    'temperature_latest': '/api/temperature/latest',
                    'turbidity_latest': '/api/turbidity/latest'
                },
                'historical': {
                    'latest': '/api/historical/latest',
                    'range': '/api/historical/range'  # Para futuro
                },
                'system': {
                    'status': '/api/status',
                    'health': '/api/health'
                }
            },
            'frontend': {
                'login': 'http://localhost:7000/login.html',
                'dashboard': 'http://localhost:7000/dashboard.html'
            },
            'documentation': 'https://github.com/t4t4n32/M_A_N_G_O/docs'
        })

    # Ruta de estado del sistema - MEJORADA
    @app.route('/api/status')
    def system_status():
        return jsonify({
            'backend': 'online',
            'version': '1.1.0',
            'timestamp': datetime.now().isoformat(),
            'server_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'environment': 'development',
            'components': {
                'sensors': {
                    'status': 'operational',
                    'available': ['ph', 'temperature', 'turbidity'],
                    'last_update': datetime.now().isoformat()
                },
                'database': {
                    'status': 'operational',
                    'type': 'simulated',  # Para producción: 'sqlite' o 'postgresql'
                    'historical_data': 'available'
                },
                'authentication': {
                    'status': 'enabled',
                    'method': 'session_cookies'
                }
            },
            'uptime': '00:00:00'  # Para implementar en producción
        })
    
    # Ruta de exploración - ¡NUEVA!
    @app.route('/api/exploration/status')
    def exploration_status():
        """Verifica si hay datos históricos disponibles (exploración realizada)"""
        try:
            # Importar aquí para evitar importación circular
            from .services.sensor_store import sensor_store
            
            has_data = False
            # Verificar si hay datos históricos en cualquier sensor
            for sensor_type in ['ph', 'temperature', 'turbidity']:
                if sensor_store.get_historical_count(sensor_type) > 0:
                    has_data = True
                    break
            
            status = "performed" if has_data else "not_performed"
            message = "Exploración realizada - datos históricos disponibles" if has_data else "No hay mediciones previas - Exploración no realizada"
            
            return jsonify({
                'status': status,
                'message': message,
                'has_historical_data': has_data,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Error verificando estado de exploración: {str(e)}',
                'has_historical_data': False,
                'timestamp': datetime.now().isoformat()
            }), 500
    
    # Manejador de errores global - ¡NUEVO!
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            'error': 'Resource not found',
            'message': 'El endpoint solicitado no existe',
            'timestamp': datetime.now().isoformat(),
            'documentation': 'https://github.com/t4t4n32/M_A_N_G_O/docs/api'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'error': 'Internal server error',
            'message': 'Error interno del servidor',
            'timestamp': datetime.now().isoformat(),
            'contact_admin': True
        }), 500
    
    # Ruta de limpieza de caché - Para desarrollo
    @app.route('/api/clear-cache')
    def clear_cache():
        """Limpia cachés para desarrollo"""
        try:
            # Limpiar caché de sensor_store
            from .services.sensor_store import sensor_store
            sensor_store.clear_cache()
            
            return jsonify({
                'message': 'Caché limpiado exitosamente',
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                'error': str(e),
                'message': 'Error limpiando caché',
                'timestamp': datetime.now().isoformat()
            }), 500
    
    return app