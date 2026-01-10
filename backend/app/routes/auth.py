from flask import Blueprint, request, jsonify, session, make_response
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Credenciales fijas (en producción usar base de datos y hashing)
VALID_CREDENTIALS = {
    "Admin": "Admin"  # Usuario: Admin, Contraseña: Admin
}

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint de autenticación
    """
    try:
        data = request.json
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        remember = data.get('remember', False)
        
        # Validar credenciales
        if username in VALID_CREDENTIALS and VALID_CREDENTIALS[username] == password:
            # Crear sesión
            session['user'] = username
            session['logged_in'] = True
            session['last_access'] = datetime.now().isoformat()
            
            # Configurar cookie de sesión
            response = make_response(jsonify({
                'message': 'Autenticación exitosa',
                'user': username,
                'timestamp': datetime.now().isoformat()
            }), 200)
            
            # Configurar tiempo de expiración
            if remember:
                # 30 días para "recordar"
                session.permanent = True
                app.permanent_session_lifetime = timedelta(days=30)
            else:
                # 1 hora por defecto
                session.permanent = True
                app.permanent_session_lifetime = timedelta(hours=1)
            
            return response
        
        return jsonify({
            'message': 'Credenciales inválidas',
            'timestamp': datetime.now().isoformat()
        }), 401
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Error en el servidor',
            'timestamp': datetime.now().isoformat()
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Cerrar sesión
    """
    session.clear()
    return jsonify({
        'message': 'Sesión cerrada exitosamente',
        'timestamp': datetime.now().isoformat()
    }), 200

@auth_bp.route('/status', methods=['GET'])
def auth_status():
    """
    Verificar estado de autenticación
    """
    is_authenticated = session.get('logged_in', False)
    user = session.get('user', 'anonymous')
    
    return jsonify({
        'authenticated': is_authenticated,
        'user': user,
        'session_valid': session.get('last_access', None) is not None,
        'timestamp': datetime.now().isoformat()
    })

# Registro de blueprint en __init__.py
# from .routes.auth import auth_bp
# app.register_blueprint(auth_bp)