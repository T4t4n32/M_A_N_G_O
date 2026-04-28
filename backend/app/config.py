import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # CHANGE_BEFORE_PRODUCTION: Set SECRET_KEY in .env with a long random value.
    SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_INSECURE_DEFAULT_KEY")

    # Database — defaults to SQLite. Set DATABASE_URL in .env for PostgreSQL.
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///mango.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # File uploads
    UPLOAD_FOLDER_MEDIA = os.path.join(os.path.dirname(__file__), "..", "uploads", "media")
    UPLOAD_FOLDER_DOCS = os.path.join(os.path.dirname(__file__), "..", "uploads", "docs")
    MAX_CONTENT_LENGTH_MEDIA = 10 * 1024 * 1024   # 10 MB
    MAX_CONTENT_LENGTH_VIDEO = 100 * 1024 * 1024  # 100 MB
    MAX_CONTENT_LENGTH_DOCS = 20 * 1024 * 1024    # 20 MB

    # CHANGE_BEFORE_PRODUCTION: Set FRONTEND_ORIGIN in .env to the real domain.
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

    # Session cookie settings — enforce security in production.
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    # CHANGE_BEFORE_PRODUCTION: Set to True when serving over HTTPS.
    SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"
