from __future__ import annotations

import os
from datetime import timedelta


class Config:
    # Database
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")

    # Sessions
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    SESSION_COOKIE_HTTPONLY:  bool = True
    SESSION_COOKIE_SAMESITE:  str  = "Lax"
    # En producción con HTTPS se activa Secure automáticamente
    SESSION_COOKIE_SECURE:    bool = os.getenv("SESSION_SECURE", "0") in ("1", "true", "yes")
    PERMANENT_SESSION_LIFETIME: timedelta = timedelta(days=7)