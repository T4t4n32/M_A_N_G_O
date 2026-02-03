# app/routes/__init__.py
from flask import Blueprint
from flask_restx import Api

# Crear Blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/api/v1/auth')
sensors_bp = Blueprint('sensors', __name__, url_prefix='/api/v1/sensors')
data_bp = Blueprint('data', __name__, url_prefix='/api/v1/data')
institutions_bp = Blueprint('institutions', __name__, url_prefix='/api/v1/institutions')
admin_bp = Blueprint('admin', __name__, url_prefix='/api/v1/admin')
public_bp = Blueprint('public', __name__, url_prefix='/api/v1/public')

# Configurar API con Swagger
api = Api(
    version='1.0',
    title='M.A.N.G.O. API',
    description='API REST para Monitoreo Autónomo de Niveles y Gestión Oceánica',
    doc='/docs',  # URL para documentación Swagger
    authorizations={
        'Bearer Auth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'JWT Token: Bearer {token}'
        }
    },
    security='Bearer Auth'
)

# Registrar namespaces
from .auth import auth_ns
from .sensors import sensors_ns
from .data import data_ns
from .institutions import institutions_ns
from .admin import admin_ns

api.add_namespace(auth_ns)
api.add_namespace(sensors_ns)
api.add_namespace(data_ns)
api.add_namespace(institutions_ns)
api.add_namespace(admin_ns)

# Función para registrar blueprints
def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(sensors_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(institutions_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(public_bp)
    
    # Registrar API de Swagger
    api.init_app(app)