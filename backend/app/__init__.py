from flask import Flask
from flask_cors import CORS
from .config import Config
from .api import register_routes

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)
    CORS(app, supports_credentials=True)

    register_routes(app)

    return app
