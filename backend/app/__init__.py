# app/__init__.py

from flask import Flask
from app.api import register_routes
from app.services.serial_manager import start_serial_thread

def create_app():
    app = Flask(__name__)

    register_routes(app)
    start_serial_thread()

    return app
