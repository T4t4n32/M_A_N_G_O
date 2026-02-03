import re
import ipaddress
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models import User

def validate_institutional_email(email):
    """Validar que el email sea de una institución reconocida"""
    institutional_domains = [
        r'.+\.edu$',
        r'.+\.gov$',
        r'.+\.gob$',
        r'.+\.org$',
        r'.+\.mil$',
        r'.+\.ac\..+$',  # Dominios académicos
        r'.+\.univ\..+$',
    ]
    
    for pattern in institutional_domains:
        if re.match(pattern, email.split('@')[1], re.IGNORECASE):
            return True
    return False

def role_required(*roles):
    """Decorator para requerir roles específicos"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.role.value not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def institution_required(fn):
    """Decorator para requerir que el usuario pertenezca a una institución"""
    @wraps(fn)
    def decorator(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.institution_id:
            return jsonify({'error': 'User not associated with an institution'}), 403
        
        return fn(*args, **kwargs)
    return decorator

def rate_limit_key():
    """Clave para rate limiting basada en IP o usuario"""
    if hasattr(request, 'user_id'):
        return request.user_id
    return get_remote_address()

def sanitize_input(data):
    """Sanitizar entrada de usuario"""
    if isinstance(data, str):
        # Eliminar caracteres peligrosos
        data = re.sub(r'[<>"\']', '', data)
        data = data.strip()
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    return data

def validate_ip(ip_str):
    """Validar dirección IP"""
    try:
        ipaddress.ip_address(ip_str)
        return True
    except ValueError:
        return False