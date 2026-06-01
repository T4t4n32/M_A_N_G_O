from __future__ import annotations

import os
from datetime import timedelta


class Config:
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    SESSION_COOKIE_HTTPONLY:  bool = True
    SESSION_COOKIE_SAMESITE:  str  = "Lax"
    SESSION_COOKIE_SECURE:    bool = os.getenv("SESSION_SECURE", "0") in ("1", "true", "yes")
    PERMANENT_SESSION_LIFETIME: timedelta = timedelta(days=7)

    # SMTP — for contact form email delivery
    SMTP_HOST:     str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT:     int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER:     str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    CONTACT_RECIPIENTS: str = os.getenv(
        "CONTACT_RECIPIENTS",
        "mango.monitoring@integramosoe.com",
    )

    # Optional Lovable auth (single admin via env, for fallback)
    ADMIN_EMAIL:         str = os.getenv("ADMIN_EMAIL", "")
    ADMIN_PASSWORD_HASH: str = os.getenv("ADMIN_PASSWORD_HASH", "")
    AUTH_DISABLED:       bool = os.getenv("AUTH_DISABLED", "0") in ("1", "true", "yes")

    # Flask request body cap — must be >= largest per-kind limit
    MAX_CONTENT_LENGTH:      int = int(os.getenv("MAX_UPLOAD_BODY_MB",   "512")) * 1024 * 1024

    # File uploads — single folder, kind subdirectories (image/video/document)
    UPLOAD_FOLDER:           str = os.getenv("UPLOAD_FOLDER", "/app/uploads")
    MAX_UPLOAD_IMAGE_BYTES:  int = int(os.getenv("MAX_UPLOAD_IMAGE_MB",  "50"))  * 1024 * 1024
    MAX_UPLOAD_VIDEO_BYTES:  int = int(os.getenv("MAX_UPLOAD_VIDEO_MB",  "500")) * 1024 * 1024
    MAX_UPLOAD_DOC_BYTES:    int = int(os.getenv("MAX_UPLOAD_DOC_MB",    "100")) * 1024 * 1024

    # Legacy keys used by admin_media.py (image/video gallery endpoint)
    UPLOAD_FOLDER_MEDIA:        str = os.getenv("UPLOAD_FOLDER_MEDIA", "/app/uploads/media")
    MAX_CONTENT_LENGTH_MEDIA:   int = int(os.getenv("MAX_UPLOAD_IMAGE_MB",  "50"))  * 1024 * 1024
    MAX_CONTENT_LENGTH_VIDEO:   int = int(os.getenv("MAX_UPLOAD_VIDEO_MB",  "500")) * 1024 * 1024
