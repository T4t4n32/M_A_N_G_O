from flask import Flask
from flask_cors import CORS

def create_app():
    """
    Crea y configura la aplicación Flask
    """
    app = Flask(__name__)
    
    # ✅ CONFIGURACIÓN DE CORS - PERMITE ACCESO DESDE EL FRONTEND
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:7000", "http://127.0.0.1:7000"],
            "methods": ["GET", "POST"],
            "allow_headers": ["Content-Type"]
        }
    })
    
    # ✅ REGISTRO DE BLUEPRINTS - RUTAS DE LA API
    from .routes.ph import ph_bp
    app.register_blueprint(ph_bp)
    
    # Agrega otros blueprints aquí cuando estén listos:
    # from .routes.temperature import temp_bp
    # app.register_blueprint(temp_bp)
    # from .routes.turbidity import turb_bp
    # app.register_blueprint(turb_bp)
    
    # ✅ RUTA DE BIENVENIDA (OPCIONAL PERO ÚTIL)
    @app.route('/')
    def welcome():
        return jsonify({
            'message': 'M.A.N.G.O Backend API',
            'status': 'online',
            'endpoints': {
                'ph_latest': '/api/ph/latest',
                'system_status': '/api/status'
            },
            'frontend': 'http://localhost:7000/dashboard.html'
        })
    
    return app