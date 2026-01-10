from flask import Flask, session, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta

def create_app():
    app = Flask(__name__)
    
    # Configuración de secret key
    app.secret_key = 'mango_secret_key_2026'  # ¡Cambiar en producción!
    
    # Configuración de sesión - CORREGIDA
    app.config.update(
        SESSION_COOKIE_SECURE=False,  # False en desarrollo
        SESSION_COOKIE_HTTPONLY=False,  # ¡DEBE SER False para frontend!
        SESSION_COOKIE_SAMESITE='Lax',
        PERMANENT_SESSION_LIFETIME=timedelta(hours=1)
    )
    
    # Configuración robusta de CORS - CORREGIDA
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:7000", "http://127.0.0.1:7000"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "supports_credentials": True,  # ¡CRÍTICO PARA COOKIES!
            "expose_headers": ["Set-Cookie"],
            "allow_credentials": True
        }
    })
    
    # Importar blueprints
    from .routes.auth import auth_bp
    from .routes.ph import ph_bp
    from .routes.temperature import temperature_bp
    from .routes.turbidity import turbidity_bp
    
    # Registrar blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(ph_bp)
    app.register_blueprint(temperature_bp)
    app.register_blueprint(turbidity_bp)
    
    # Ruta de bienvenida
    @app.route('/')
    def welcome():
        return jsonify({
            'message': 'M.A.N.G.O Backend API',
            'status': 'online',
            'endpoints': {
                'login': '/api/auth/login',
                'ph_latest': '/api/ph/latest',
                'temperature_latest': '/api/temperature/latest',
                'turbidity_latest': '/api/turbidity/latest',
                'system_status': '/api/status',
                'auth_status': '/api/auth/status'
            },
            'frontend_url': 'http://localhost:7000/login.html'
        })

    # Ruta de estado del sistema
    @app.route('/api/status')
    def system_status():
        return jsonify({
            'backend': 'online',
            'version': '1.0.0',
            'sensors': ['ph', 'temperature', 'turbidity'],
            'authentication': 'enabled',
            'cors_configured': True,
            'timestamp': datetime.now().isoformat()
        })
    
    return app