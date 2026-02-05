from flask import Flask
import sqlite3
from app.config import Config
from flask_cors import CORS
from app.extensions import db
from app.routes import register_routes

def get_db_connection():
    conn = sqlite3.connect(Config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_app():
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///mango.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    with app.app_context():
        db.create_all()

    register_routes(app)
    
    app = Flask(__name__)

    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://127.0.0.1:8000",
                "http://localhost:8000"
            ]
        }
    })
    
    return app

    from app.routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")
    return app
