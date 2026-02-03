from flask import Flask
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "mango.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_app():
    app = Flask(__name__)

    from app.routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    return app
