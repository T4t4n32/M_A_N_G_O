from __future__ import annotations

import os
from datetime import timedelta


def _truthy(val: str) -> bool:
    return val.lower() in ("1", "true", "yes")


class Config:
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    SESSION_COOKIE_HTTPONLY:  bool = True
    SESSION_COOKIE_SAMESITE:  str  = "Lax"
    SESSION_COOKIE_SECURE:    bool = _truthy(os.getenv("SESSION_SECURE", "0"))
    PERMANENT_SESSION_LIFETIME: timedelta = timedelta(days=7)

    # CORS — comma-separated list of allowed origins
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "https://integramosoe.com,https://www.integramosoe.com,"
            "http://localhost:5173,http://localhost:3000,http://localhost:8080",
        ).split(",")
        if o.strip()
    ]

    # Super-admin identity — login accepted by username (preferred) or email.
    # Set SUPER_ADMIN_USERNAME to allow non-email identifiers.
    SUPER_ADMIN_EMAIL:    str = os.getenv("SUPER_ADMIN_EMAIL", "")
    SUPER_ADMIN_USERNAME: str = os.getenv("SUPER_ADMIN_USERNAME", "")

    # SMTP — for contact form email delivery
    SMTP_HOST:     str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT:     int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER:     str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    CONTACT_RECIPIENTS: str = os.getenv(
        "CONTACT_RECIPIENTS",
        "mango.monitoring@integramosoe.com",
    )

    # Optional env-based admin fallback (lovable_auth.py)
    ADMIN_EMAIL:         str = os.getenv("ADMIN_EMAIL", "")
    ADMIN_PASSWORD_HASH: str = os.getenv("ADMIN_PASSWORD_HASH", "")
    AUTH_DISABLED:       bool = _truthy(os.getenv("AUTH_DISABLED", "0"))

    # Flask request body cap — must be >= largest per-kind limit (video)
    MAX_CONTENT_LENGTH: int = int(os.getenv("MAX_UPLOAD_VIDEO_MB", "2000")) * 1024 * 1024

    # Unified upload folder — kind subdirectories: image / video / document
    UPLOAD_FOLDER:          str = os.getenv("UPLOAD_FOLDER", "/app/uploads")
    MAX_UPLOAD_IMAGE_BYTES: int = int(os.getenv("MAX_UPLOAD_IMAGE_MB", "200"))  * 1024 * 1024
    MAX_UPLOAD_VIDEO_BYTES: int = int(os.getenv("MAX_UPLOAD_VIDEO_MB", "2000")) * 1024 * 1024
    MAX_UPLOAD_DOC_BYTES:   int = int(os.getenv("MAX_UPLOAD_DOC_MB",   "500"))  * 1024 * 1024

    # Legacy media/docs folders (admin_media, admin_docs blueprints)
    UPLOAD_FOLDER_MEDIA:      str = os.getenv("UPLOAD_FOLDER_MEDIA", "/app/uploads/media")
    UPLOAD_FOLDER_DOCS:       str = os.getenv("UPLOAD_FOLDER_DOCS",  "/app/uploads/docs")
    MAX_CONTENT_LENGTH_MEDIA: int = int(os.getenv("MAX_UPLOAD_IMAGE_MB", "200"))  * 1024 * 1024
    MAX_CONTENT_LENGTH_VIDEO: int = int(os.getenv("MAX_UPLOAD_VIDEO_MB", "2000")) * 1024 * 1024
    MAX_CONTENT_LENGTH_DOCS:  int = int(os.getenv("MAX_UPLOAD_DOC_MB",   "20"))   * 1024 * 1024
