from flask import Flask
import sqlite3
from app.config import Config
from flask_cors import CORS

def get_db_connection():
    conn = sqlite3.connect(Config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_app():
    app = Flask(__name__)

    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://127.0.0.1:8000",
                "http://localhost:8000"
            ]
        }
    })

    from app.routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")
    return app
