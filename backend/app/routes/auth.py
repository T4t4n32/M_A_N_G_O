# backend/app/routes/auth.py
"""
Rutas de autenticación para M.A.N.G.O
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import bcrypt

auth_bp = Blueprint('auth', __name__)

# Base de datos simple de usuarios (EN PRODUCCIÓN: usar base de datos real)
# Para desarrollo inicial, usar credenciales básicas
USERS = {
    'admin': {
        'password_hash': bcrypt.hashpw('Admin'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        'role': 'admin',
        'full_name': 'Administrador del Sistema'
    },
    'ong': {
        'password_hash': bcrypt.hashpw('ONG2026'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        'role': 'ong',
        'full_name': 'ONG Ambiental'
    },
    'university': {
        'password_hash': bcrypt.hashpw('Uni2026'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        'role': 'university',
        'full_name': 'Universidad'
    }
}

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint para login de usuarios
    Body: { "username": "admin", "password": "Admin", "remember": false }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No se recibieron datos',
                'message': 'El cuerpo de la solicitud debe ser JSON válido',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        username = data.get('username', '').strip().lower()
        password = data.get('password', '').strip()
        remember = data.get('remember', False)
        
        # Validación básica
        if not username or not password:
            return jsonify({
                'error': 'Campos incompletos',
                'message': 'Usuario y contraseña son requeridos',
                'timestamp': datetime.now().isoformat()
            }), 400
        
        # Buscar usuario
        user = USERS.get(username)
        if not user:
            return jsonify({
                'error': 'Credenciales inválidas',
                'message': 'Usuario o contraseña incorrectos',
                'timestamp': datetime.now().isoformat()
            }), 401
        
        # Verificar contraseña
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({
                'error': 'Credenciales inválidas',
                'message': 'Usuario o contraseña incorrectos',
                'timestamp': datetime.now().isoformat()
            }), 401
        
        # Crear sesión
        session.permanent = remember
        session['user_id'] = username
        session['role'] = user['role']
        session['full_name'] = user['full_name']
        session['login_time'] = datetime.now().isoformat()
        
        # Calcular tiempo de expiración
        session_lifetime = timedelta(days=30) if remember else timedelta(hours=2)
        session_expires = datetime.now() + session_lifetime
        
        return jsonify({
            'success': True,
            'user': {
                'username': username,
                'role': user['role'],
                'full_name': user['full_name']
            },
            'session_expires': session_expires.isoformat(),
            'message': 'Login exitoso',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error en login: {str(e)}")
        return jsonify({
            'error': 'Error interno del servidor',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Endpoint para logout de usuarios
    """
    try:
        session.clear()
        return jsonify({
            'success': True,
            'message': 'Logout exitoso',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Error interno del servidor',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@auth_bp.route('/status', methods=['GET'])
def auth_status():
    """
    Verificar si el usuario está autenticado
    """
    try:
        if 'user_id' in session:
            return jsonify({
                'authenticated': True,
                'user': {
                    'username': session.get('user_id'),
                    'role': session.get('role'),
                    'full_name': session.get('full_name'),
                    'session_started': session.get('login_time')
                },
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'authenticated': False,
                'timestamp': datetime.now().isoformat()
            }), 200
    except Exception as e:
        return jsonify({
            'error': 'Error interno del servidor',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500