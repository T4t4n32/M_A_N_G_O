"""
Application configuration.

This module defines a simple ``Config`` class which reads
configuration values from environment variables with sensible
defaults. It can be extended or replaced in the future if more
complex configuration management is required.
"""

from __future__ import annotations

import os


class Config:
    """Base configuration for the Flask application.

    Attributes
    ----------
    SQLALCHEMY_DATABASE_URI : str
        The database connection URI. If not provided via the
        ``DATABASE_URL`` environment variable, defaults to an empty
        string which causes SQLAlchemy to defer connection until
        explicitly configured.
    SQLALCHEMY_TRACK_MODIFICATIONS : bool
        Disable modification tracking overhead in SQLAlchemy.
    REDIS_URL : str
        The Redis connection URI used by Celery and optional cache.
        Defaults to ``redis://redis:6379/0``.
    SECRET_KEY : str
        Secret key used for session signing. Should be changed in
        production to a long, random value.
    """

    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
