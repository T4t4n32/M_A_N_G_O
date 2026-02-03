# app/utils/security.py
import bcrypt
import jwt
from datetime import datetime, timedelta
from flask import current_app
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt

class SecurityManager:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash seguro de contraseña con bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verificar contraseña contra hash"""
        return bcrypt.checkpw(
            password.encode('utf-8'), 
            hashed.encode('utf-8')
        )
    
    @staticmethod
    def generate_jwt(payload: dict, expires_in: int = 3600) -> str:
        """Generar token JWT"""
        payload.update({
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(seconds=expires_in)
        })
        return jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
    
    @staticmethod
    def verify_jwt(token: str) -> dict:
        """Verificar y decodificar token JWT"""
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception('Token expirado')
        except jwt.InvalidTokenError:
            raise Exception('Token inválido')

def role_required(*roles):
    """Decorador para requerir roles específicos"""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            
            if 'role' not in claims:
                return {'error': 'Token no contiene rol'}, 403
            
            if claims['role'] not in roles:
                return {'error': 'Permisos insuficientes'}, 403
            
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def institution_required(fn):
    """Decorador para requerir institución"""
    @wraps(fn)
    def decorator(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        
        if 'institution_id' not in claims:
            return {'error': 'Usuario no asociado a institución'}, 403
        
        return fn(*args, **kwargs)
    return decorator