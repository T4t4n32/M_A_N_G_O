# app/config.py
import os
from datetime import timedelta

class Config:
    """Configuración base"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "1000 per hour"
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # Redis
    REDIS_URL = os.environ.get('REDIS_URL')
    
    # Email
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # File Uploads
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = '/app/uploads'
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # API
    API_PREFIX = '/api/v1'
    API_TITLE = 'M.A.N.G.O. API'
    API_VERSION = '1.0.0'
    OPENAPI_VERSION = '3.0.2'

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # Más largo en dev

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL', 'sqlite:///:memory:')

class ProductionConfig(Config):
    DEBUG = False
    # Forzar HTTPS en producción
    PREFERRED_URL_SCHEME = 'https'
    # Configuración más estricta
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_HTTPONLY = True
    JWT_COOKIE_SAMESITE = 'Strict'
    # Rate limiting más estricto
    RATELIMIT_DEFAULT = "100 per minute, 1000 per hour"

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}