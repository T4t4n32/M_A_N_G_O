from flask import Blueprint, request, jsonify, session, make_response
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Credenciales fijas
VALID_CREDENTIALS = {
    "Admin": "Admin"
}

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint de login - CORREGIDO"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No se enviaron datos'}), 400
            
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        remember = data.get('remember', False)
        
        # Validar credenciales
        if username in VALID_CREDENTIALS and VALID_CREDENTIALS[username] == password:
            # Crear sesión
            session['user'] = username
            session['logged_in'] = True
            session['last_access'] = datetime.now().isoformat()
            
            # Crear respuesta con cookies
            response = make_response(jsonify({
                'message': 'Autenticación exitosa',
                'user': username,
                'timestamp': datetime.now().isoformat()
            }), 200)
            
            # Configurar cookies manualmente para asegurar envío
            response.set_cookie(
                'mango_session', 
                'authenticated',
                max_age=2678400 if remember else 3600,  # 30 días o 1 hora
                httponly=False,  # ¡DEBE SER False para acceso desde JavaScript!
                samesite='Lax',
                secure=False  # False en desarrollo, True en producción con HTTPS
            )
            
            return response
        
        return jsonify({
            'message': 'Credenciales inválidas',
            'timestamp': datetime.now().isoformat()
        }), 401
        
    except Exception as e:
        print(f"Error en login: {str(e)}")
        return jsonify({
            'error': str(e),
            'message': 'Error interno del servidor',
            'timestamp': datetime.now().isoformat()
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Endpoint de logout"""
    session.clear()
    response = make_response(jsonify({
        'message': 'Sesión cerrada exitosamente',
        'timestamp': datetime.now().isoformat()
    }), 200)
    response.delete_cookie('mango_session')
    return response

@auth_bp.route('/status', methods=['GET'])
def auth_status():
    """Endpoint de estado de autenticación - CORREGIDO"""
    try:
        # Verificar sesión de Flask
        is_authenticated = session.get('logged_in', False)
        user = session.get('user', 'anonymous')
        
        # Verificar cookie manual
        mango_cookie = request.cookies.get('mango_session')
        cookie_valid = mango_cookie == 'authenticated'
        
        # Combinar ambos métodos de verificación
        final_authenticated = is_authenticated or cookie_valid
        
        return jsonify({
            'authenticated': final_authenticated,
            'user': user if final_authenticated else 'anonymous',
            'session_valid': is_authenticated,
            'cookie_valid': cookie_valid,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error en auth_status: {str(e)}")
        return jsonify({
            'error': str(e),
            'authenticated': False,
            'user': 'anonymous',
            'timestamp': datetime.now().isoformat()
        }), 500