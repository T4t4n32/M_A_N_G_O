# backend/main.py
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('.env.local')

# Configuración
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'local-dev')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Habilitar CORS para desarrollo local
CORS(app)

# Inicializar base de datos
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# ========== MODELOS BÁSICOS ==========
class Institution(db.Model):
    __tablename__ = 'institutions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), unique=True, nullable=False)
    domain = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    role = db.Column(db.String(50), default='viewer')
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    institution = db.relationship('Institution', backref='users')

class SensorStation(db.Model):
    __tablename__ = 'sensor_stations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    institution_id = db.Column(db.Integer, db.ForeignKey('institutions.id'))
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    institution = db.relationship('Institution', backref='stations')

# ========== ENDPOINTS BÁSICOS ==========
@app.route('/')
def index():
    return jsonify({
        'app': 'M.A.N.G.O. API Local',
        'version': '1.0.0',
        'status': 'running',
        'environment': 'development',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/health')
def health():
    try:
        # Probar conexión a base de datos
        db.session.execute('SELECT 1')
        db_status = 'connected'
    except Exception as e:
        db_status = f'disconnected: {str(e)}'
    
    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/info')
def info():
    return jsonify({
        'project': 'M.A.N.G.O. - Monitoreo Autónomo de Niveles y Gestión Oceánica',
        'description': 'Plataforma de monitoreo ambiental LOCAL',
        'access': 'Modo desarrollo - Acceso abierto',
        'contact': 'INTEGRAMOS OE',
        'endpoints': {
            'GET /': 'Información API',
            'GET /api/health': 'Estado del sistema',
            'GET /api/info': 'Información del proyecto',
            'GET /api/institutions': 'Listar instituciones',
            'POST /api/institutions': 'Crear institución',
            'GET /api/users': 'Listar usuarios',
            'POST /api/users': 'Crear usuario'
        }
    })

# ========== CRUD BÁSICO ==========
@app.route('/api/institutions', methods=['GET', 'POST'])
def institutions():
    if request.method == 'GET':
        institutions = Institution.query.all()
        return jsonify([{
            'id': i.id,
            'name': i.name,
            'domain': i.domain,
            'created_at': i.created_at.isoformat() if i.created_at else None
        } for i in institutions])
    
    elif request.method == 'POST':
        data = request.get_json()
        if not data or 'name' not in data or 'domain' not in data:
            return jsonify({'error': 'Nombre y dominio requeridos'}), 400
        
        institution = Institution(
            name=data['name'],
            domain=data['domain']
        )
        db.session.add(institution)
        db.session.commit()
        
        return jsonify({
            'id': institution.id,
            'name': institution.name,
            'domain': institution.domain,
            'message': 'Institución creada'
        }), 201

@app.route('/api/users', methods=['GET', 'POST'])
def users():
    if request.method == 'GET':
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'role': u.role,
            'institution_id': u.institution_id,
            'is_active': u.is_active
        } for u in users])
    
    elif request.method == 'POST':
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({'error': 'Email requerido'}), 400
        
        # Verificar que la institución existe
        institution = None
        if 'institution_id' in data:
            institution = Institution.query.get(data['institution_id'])
            if not institution:
                return jsonify({'error': 'Institución no encontrada'}), 404
        
        user = User(
            email=data['email'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            role=data.get('role', 'viewer'),
            institution_id=data.get('institution_id'),
            is_active=data.get('is_active', False)
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'message': 'Usuario creado (sin contraseña)'
        }), 201

# ========== INICIALIZACIÓN ==========
def init_db():
    """Inicializar base de datos con datos de prueba"""
    with app.app_context():
        # Crear tablas
        db.create_all()
        
        # Crear institución por defecto si no existe
        if not Institution.query.filter_by(name='INTEGRAMOS OE').first():
            institution = Institution(
                name='INTEGRAMOS OE',
                domain='integramosoe.com'
            )
            db.session.add(institution)
            db.session.commit()
            print("✅ Institución por defecto creada")
        
        # Crear usuario admin si no existe
        if not User.query.filter_by(email='admin@local.com').first():
            admin = User(
                email='admin@local.com',
                first_name='Admin',
                last_name='Local',
                role='admin',
                institution_id=1,
                is_active=True
            )
            db.session.add(admin)
            db.session.commit()
            print("✅ Usuario admin creado: admin@local.com")
        
        print("✅ Base de datos inicializada")

if __name__ == '__main__':
    # Inicializar base de datos
    init_db()
    
    # Iniciar servidor
    print("🚀 Iniciando M.A.N.G.O. API Local...")
    print(f"📡 URL: http://localhost:{os.getenv('API_PORT', 5000)}")
    print("📋 Endpoints disponibles:")
    print("   • GET /              - Información API")
    print("   • GET /api/health    - Estado del sistema")
    print("   • GET /api/info      - Información del proyecto")
    print("   • GET /api/institutions - Listar instituciones")
    print("   • POST /api/institutions - Crear institución")
    print("   • GET /api/users     - Listar usuarios")
    print("   • POST /api/users    - Crear usuario")
    
    app.run(
        host=os.getenv('API_HOST', '0.0.0.0'),
        port=int(os.getenv('API_PORT', 5000)),
        debug=True
    )