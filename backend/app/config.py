# backend/app/config.py
"""
Configuración del sistema M.A.N.G.O
"""
import os
from datetime import timedelta

class Config:
    """Configuración base"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'mango_dev_key_fallback_2026')
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
    
    # Configuración de Sesiones
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(seconds=int(os.environ.get('PERMANENT_SESSION_LIFETIME', 2592000)))
    
    # Configuración de Base de Datos
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://mango_user:mango_pass@localhost:5432/mango_db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # Cambiar a True en desarrollo para ver queries
    
    # Configuración CORS
    CORS_ENABLED = os.environ.get('CORS_ENABLED', 'True').lower() == 'true'
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:7000').split(',')
    
    # Rate Limiting
    API_RATE_LIMIT = os.environ.get('API_RATE_LIMIT', '100/hour')
    RATELIMIT_STORAGE_URI = os.environ.get('RATELIMIT_STORAGE_URI', 'memory://')
    
    # Modo Offline
    OFFLINE_MODE = os.environ.get('OFFLINE_MODE', 'False').lower() == 'true'
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', '/var/log/mango/backend.log')

class DevelopmentConfig(Config):
    """Configuración para desarrollo"""
    DEBUG = True
    ENVIRONMENT = 'development'
    SESSION_COOKIE_SECURE = False
    SQLALCHEMY_ECHO = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """Configuración para producción"""
    DEBUG = False
    ENVIRONMENT = 'production'
    SESSION_COOKIE_SECURE = True
    SQLALCHEMY_ECHO = False
    LOG_LEVEL = 'INFO'

# Configuración por defecto
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}