# backend/app/__init__.py
"""
M.A.N.G.O - Monitoreo Autónomo de Niveles y Gestión Oceánica
Backend API Flask
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import logging
from logging.handlers import RotatingFileHandler
import os
from datetime import datetime

# Inicializar extensiones
db = SQLAlchemy()
migrate = Migrate()
limiter = None

def create_app(config_name='default'):
    """Factory pattern para crear la aplicación Flask"""
    app = Flask(__name__)
    
    # Cargar configuración
    from .config import config
    app.config.from_object(config[config_name])
    
    # Inicializar extensiones
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Configurar CORS
    if app.config['CORS_ENABLED']:
        CORS(app, resources={
            r"/api/*": {
                "origins": app.config['ALLOWED_ORIGINS'],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True
            }
        })
    
    # Configurar Rate Limiting
    global limiter
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=[app.config['API_RATE_LIMIT']],
        storage_uri=app.config['RATELIMIT_STORAGE_URI']
    )
    
    # Configurar logging
    configure_logging(app)
    
    # Registrar blueprints
    register_blueprints(app)
    
    # Registrar manejadores de errores
    register_error_handlers(app)
    
    # Crear tablas en la base de datos
    with app.app_context():
        db.create_all()
    
    return app

def configure_logging(app):
    """Configurar sistema de logging"""
    # Crear directorio de logs si no existe
    log_dir = os.path.dirname(app.config['LOG_FILE'])
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Configurar handler de archivo
    file_handler = RotatingFileHandler(
        app.config['LOG_FILE'],
        maxBytes=10*1024*1024,  # 10 MB
        backupCount=10
    )
    file_handler.setLevel(getattr(logging, app.config['LOG_LEVEL']))
    file_formatter = logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    )
    file_handler.setFormatter(file_formatter)
    
    # Configurar handler de consola
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter('%(levelname)s: %(message)s')
    console_handler.setFormatter(console_formatter)
    
    # Agregar handlers a la app
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(getattr(logging, app.config['LOG_LEVEL']))
    
    app.logger.info('M.A.N.G.O Backend logging configurado')

def register_blueprints(app):
    """Registrar todos los blueprints de la aplicación"""
    # Importar blueprints
    from .routes.auth import auth_bp
    from .routes.sensors import sensors_bp
    from .routes.historical import historical_bp
    from .routes.health import health_bp
    
    # Registrar blueprints con prefijo
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(sensors_bp, url_prefix='/api/sensors')
    app.register_blueprint(historical_bp, url_prefix='/api/historical')
    app.register_blueprint(health_bp, url_prefix='/api')

def register_error_handlers(app):
    """Registrar manejadores de errores globales"""
    
    @app.errorhandler(404)
    def not_found_error(error):
        """Error 404 - Recurso no encontrado"""
        app.logger.warning(f'404 Error: {request.path}')
        return jsonify({
            'error': 'Recurso no encontrado',
            'message': f'La ruta {request.path} no existe',
            'timestamp': datetime.now().isoformat()
        }), 404
    
    @app.errorhandler(401)
    def unauthorized_error(error):
        """Error 401 - No autorizado"""
        return jsonify({
            'error': 'No autorizado',
            'message': 'Debe iniciar sesión para acceder a este recurso',
            'timestamp': datetime.now().isoformat()
        }), 401
    
    @app.errorhandler(403)
    def forbidden_error(error):
        """Error 403 - Acceso denegado"""
        return jsonify({
            'error': 'Acceso denegado',
            'message': 'No tiene permisos suficientes para esta acción',
            'timestamp': datetime.now().isoformat()
        }), 403
    
    @app.errorhandler(429)
    def rate_limit_error(error):
        """Error 429 - Límite de peticiones excedido"""
        return jsonify({
            'error': 'Límite de peticiones excedido',
            'message': 'Demasiadas solicitudes. Por favor, espere antes de intentar nuevamente',
            'retry_after': 60,
            'timestamp': datetime.now().isoformat()
        }), 429
    
    @app.errorhandler(500)
    def internal_error(error):
        """Error 500 - Error interno del servidor"""
        app.logger.error(f'500 Error: {str(error)}')
        return jsonify({
            'error': 'Error interno del servidor',
            'message': 'Ocurrió un error inesperado. Por favor, intente nuevamente más tarde',
            'timestamp': datetime.now().isoformat()
        }), 500