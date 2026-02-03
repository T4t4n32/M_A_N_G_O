# app/middleware/rate_limit_middleware.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import request
import redis

def get_limiter_key():
    """Clave para rate limiting basada en usuario o IP"""
    # Intentar obtener user_id del JWT
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        try:
            token = auth_header.split(' ')[1]
            from app.utils.security import SecurityManager
            payload = SecurityManager.verify_jwt(token)
            return f"user:{payload.get('sub')}"
        except:
            pass
    
    # Fallback a IP address
    return get_remote_address()

# Configurar rate limiter
limiter = Limiter(
    key_func=get_limiter_key,
    default_limits=["1000 per hour", "100 per minute"],
    storage_uri="redis://localhost:6379/0",
    strategy="fixed-window",
    headers_enabled=True
)

# Límites específicos por endpoint
AUTH_RATE_LIMITS = ["5 per minute", "50 per hour"]
SENSOR_INGEST_LIMITS = ["100 per minute", "10000 per day"]
DATA_EXPORT_LIMITS = ["10 per hour", "50 per day"]