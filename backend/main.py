#!/usr/bin/env python3
"""
M.A.N.G.O - Monitoreo Autónomo de Niveles y Gestión Oceánica
Sistema de backend para monitoreo de sensores en manglares
"""
import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

from app import create_app, db
from app.models import Device, SensorReading, Alert

def initialize_database():
    """Inicializa la base de datos con datos básicos"""
    with app.app_context():
        # Crear tablas
        db.create_all()
        
        # Crear dispositivo de ejemplo si no existe
        device = Device.query.filter_by(id='MANGO_001').first()
        if not device:
            device = Device(
                id='MANGO_001',
                name='Dispositivo M.A.N.G.O Principal',
                type='sensor',
                location_lat=3.456,
                location_lng=-76.789,
                deployment_date=None,
                status='active',
                firmware_version='1.0.0'
            )
            db.session.add(device)
            db.session.commit()
            print("✅ Dispositivo de ejemplo creado")

def print_startup_info():
    """Imprime información de inicio"""
    env = os.environ.get('ENVIRONMENT', 'development')
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    print(f"""
    {'='*70}
    🌿 M.A.N.G.O - Backend API
    {'='*70}
    🚀 Modo: {env.upper()}
    🌐 Host: {host}:{port}
    🔒 Autenticación: {'Habilitada'}
    💾 Base de datos: {'PostgreSQL + PostGIS'}
    📡 Sensores: {'Conectados' if not app.config['OFFLINE_MODE'] else 'Simulación'}
    {'-'*70}
    Acceder a:
    • API Docs: http://{host}:{port}/api/health
    • Sistema de salud: http://{host}:{port}/api/status
    • Dashboard: http://localhost:7000/dashboard.html
    {'='*70}
    Presione CTRL+C para detener el servidor
    """)

if __name__ == '__main__':
    # Crear aplicación
    config_name = os.environ.get('ENVIRONMENT', 'development')
    app = create_app(config_name)
    
    # Inicializar base de datos
    initialize_database()
    
    # Imprimir información de inicio
    print_startup_info()
    
    # Ejecutar aplicación
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    app.run(host=host, port=port, debug=app.config['DEBUG'])