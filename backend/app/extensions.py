"""
Extensions used by the Flask application.

This module initialises and exposes application-wide extensions such
as SQLAlchemy and, optionally, Redis. Initialising extensions in a
central location helps avoid circular imports and ensures that
extensions are available to all parts of the application once
``create_app`` has been called.
"""

from __future__ import annotations

from flask_sqlalchemy import SQLAlchemy


# SQLAlchemy database instance. This will be bound to the Flask app
# inside ``create_app`` via ``db.init_app(app)``.
db: SQLAlchemy = SQLAlchemy()


def init_redis(app) -> object | None:
    """Initialise a Redis client.

    Attempts to create a Redis client based on the ``REDIS_URL``
    configuration setting and stores it on the Flask application's
    ``extensions`` dictionary under the ``"redis"`` key. If the
    ``redis`` package is not installed or the connection cannot be
    established, the function silently returns ``None``.

    Parameters
    ----------
    app : flask.Flask
        The Flask application instance to which the Redis client
        should be attached.

    Returns
    -------
    object | None
        The Redis client if initialisation succeeds, otherwise
        ``None``.
    """
    redis_url = app.config.get("REDIS_URL")
    if not redis_url:
        return None

    try:
        import redis  # type: ignore
    except Exception:
        return None

    try:
        client = redis.Redis.from_url(redis_url)
        # Simple connectivity check; this will raise an exception if
        # the server is unreachable.
        client.ping()
    except Exception:
        return None

    # Attach the client to the app's extensions for later access.
    app.extensions.setdefault("redis", client)
    return client
