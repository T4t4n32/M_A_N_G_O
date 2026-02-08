# backend/app/config.py
import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
    if not DATABASE_URL:
        # fallback seguro (por si no está set)
        DATABASE_URL = "postgresql+psycopg2://mango:mango@db:5432/mango"

    SQLALCHEMY_DATABASE_URI = DATABASE_URL

    JSON_SORT_KEYS = False
