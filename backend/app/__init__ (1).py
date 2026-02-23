"""
Root package initializer for the backend application.

This module simply exposes the ``create_app`` factory from the
underlying ``app`` package. The actual application code lives in
the ``app`` subpackage which contains configuration, extensions,
models and routes. Importing ``create_app`` from here allows
existing entrypoints like ``main.py`` and ``wsgi.py`` to continue
working without modification.
"""

from app import create_app  # type: ignore[F401]

__all__ = ["create_app"]
