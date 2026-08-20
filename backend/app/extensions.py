"""Flask extensions (DB + optional Redis).

This file is used by the Flask app factory and also imported by some
routes (e.g. health checks). Your error was:

    ImportError: cannot import name 'redis_client' from 'app.extensions'

So we define `redis_client` here and initialise it safely.
"""

from __future__ import annotations

import logging

from flask_sqlalchemy import SQLAlchemy

log = logging.getLogger("mango.extensions")

# SQLAlchemy instance
db: SQLAlchemy = SQLAlchemy()

# Optional Redis client (can be None)
redis_client = None


def init_redis(app):
    """Initialise Redis and expose it as `redis_client`.

    - If the `redis` library is missing, or Redis is unreachable,
      it stays as None (no crash).
    - If it succeeds, it also stores the client in `app.extensions["redis"]`.
    """

    global redis_client

    redis_url = app.config.get("REDIS_URL")
    if not redis_url:
        log.warning("REDIS_URL not configured — SSE stream and caching disabled")
        redis_client = None
        return None

    try:
        import redis  # type: ignore
    except ImportError:
        log.warning("redis package not installed — SSE stream and caching disabled")
        redis_client = None
        return None

    try:
        client = redis.Redis.from_url(redis_url)
        client.ping()
    except Exception as exc:
        log.warning("Redis unreachable at %s (%s: %s) — SSE stream and caching disabled",
                    redis_url, type(exc).__name__, exc)
        redis_client = None
        return None

    redis_client = client
    app.extensions.setdefault("redis", client)
    return client
