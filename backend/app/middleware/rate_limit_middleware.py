"""
Flask-Limiter extension — initialized lazily via init_limiter(app).

Usage in routes:
    from app.middleware.rate_limit_middleware import limiter

    @blueprint.post("/login")
    @limiter.limit("10 per minute")
    def login(): ...
"""
from __future__ import annotations

from flask import Flask
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per hour", "200 per minute"],
    headers_enabled=True,
    # storage_uri injected in init_limiter via app.config
)


def init_limiter(app: Flask) -> None:
    redis_uri = app.config.get("REDIS_URL", "redis://redis:6379/0")
    limiter._storage_uri = redis_uri  # type: ignore[attr-defined]
    limiter.init_app(app)
