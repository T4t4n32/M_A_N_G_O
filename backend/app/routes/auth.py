# backend/app/routes/auth.py
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

# Base de datos simple de usuarios (EN PRODUCCIÓN: usar base de datos real)
# Para desarrollo inicial, usar credenciales básicas
USERS = {
    'admin': {
        'password_hash': generate_password_hash('Admin'),  # Contraseña: Admin
        'role': 'admin',
        'full_name': 'Administrador'
    },
    'ong': {
        'password_hash': generate_password_hash('ONG2026'),  # Contraseña: ONG2026
        'role': 'ong',
        'full_name': 'ONG Ambiental'
    },
    'university': {
        'password_hash': generate_password_hash('Uni2026'),  # Contraseña: Uni2026
        'role': 'university',
        'full_name': 'Universidad'
    }
}

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint para login de usuarios"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        username = data.get('username', '').lower()
        password = data.get('password', '')
        
        # Validación básica
        if not username or not password:
            return jsonify({'error': 'Usuario y contraseña son requeridos'}), 400
        
        # Buscar usuario
        user = USERS.get(username)
        if not user:
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        # Verificar contraseña
        if not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        # Crear sesión
        session.permanent = True
        session['user_id'] = username
        session['role'] = user['role']
        session['full_name'] = user['full_name']
        session['login_time'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'user': {
                'username': username,
                'role': user['role'],
                'full_name': user['full_name']
            },
            'message': 'Login exitoso'
        })
        
    except Exception as e:
        print(f"Error en login: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Endpoint para logout de usuarios"""
    try:
        session.clear()
        return jsonify({'success': True, 'message': 'Logout exitoso'})
    except Exception as e:
        print(f"Error en logout: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@auth_bp.route('/status', methods=['GET'])
def auth_status():
    """Verificar si el usuario está autenticado"""
    try:
        if 'user_id' in session:
            return jsonify({
                'authenticated': True,
                'user': {
                    'username': session.get('user_id'),
                    'role': session.get('role'),
                    'full_name': session.get('full_name')
                }
            })
        else:
            return jsonify({'authenticated': False})
    except Exception as e:
        print(f"Error en auth_status: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@auth_bp.route('/check', methods=['GET'])
def check():
    """Endpoint para verificar que el backend está funcionando"""
    return jsonify({
        'status': 'ok',
        'service': 'auth',
        'timestamp': datetime.now().isoformat()
    })