# backend/app/routes/__init__.py
"""
Módulo de rutas de la API
"""
from .auth import auth_bp
from .sensors import sensors_bp
from .historical import historical_bp
from .health import health_bp

__all__ = ['auth_bp', 'sensors_bp', 'historical_bp', 'health_bp']