import os


class Config:
    APP_NAME = "MANGO"
    ENV = os.getenv("APP_ENV", "local")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-change-me")
    JSON_SORT_KEYS = False

    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////app/data/mango.db")
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    REDIS_URL = os.getenv("REDIS_URL", "")
    DEFAULT_STATION_NAME = os.getenv("DEFAULT_STATION_NAME", "MANGO Station")
