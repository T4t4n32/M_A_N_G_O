# backend/app/extensions.py
from __future__ import annotations

from typing import Optional

import redis
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
redis_client: Optional[redis.Redis] = None


def init_redis(app) -> Optional[redis.Redis]:
    """
    Inicializa Redis y lo deja accesible en app.extensions['redis'].
    Si no hay REDIS_URL, no revienta: deja redis_client=None.
    """
    global redis_client

    url = app.config.get("REDIS_URL")
    if not url:
        redis_client = None
        app.extensions["redis"] = None
        return None

    redis_client = redis.Redis.from_url(
        url,
        decode_responses=True,
        socket_timeout=2,
        socket_connect_timeout=2,
        health_check_interval=15,
    )
    app.extensions["redis"] = redis_client
    return redis_client


def redis_ok() -> bool:
    try:
        return redis_client is not None and redis_client.ping() is True
    except Exception:
        return False
