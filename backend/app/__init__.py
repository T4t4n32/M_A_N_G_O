from flask import Flask
from app.config import Config
from app.extensions import db, init_redis
from app.routes import register_routes

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config())

    db.init_app(app)
    init_redis(app)

    register_routes(app)
    return app
