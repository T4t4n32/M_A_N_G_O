"""
Ingest API key authentication.

Usage:
    from app.auth_ingest import require_ingest_key

    @bp.post("/ingest")
    @require_ingest_key
    def ingest():
        ...

Set INGEST_API_KEY in environment. If the variable is empty or not set,
the check is SKIPPED (dev/local mode). Set it in production.

Clients must send:
    X-Api-Key: <your key>
"""

from __future__ import annotations

import os
from functools import wraps

from flask import jsonify, request


def _get_configured_key() -> str | None:
    key = os.getenv("INGEST_API_KEY", "").strip()
    return key if key else None


def require_ingest_key(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        configured = _get_configured_key()

        # No key configured → allow all (dev mode)
        if configured is None:
            return fn(*args, **kwargs)

        provided = (
            request.headers.get("X-Api-Key", "").strip()
            or request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        )

        if not provided:
            return jsonify({"error": "missing_api_key", "message": "X-Api-Key header required"}), 401

        # Constant-time comparison to prevent timing attacks
        import hmac
        if not hmac.compare_digest(provided.encode(), configured.encode()):
            return jsonify({"error": "invalid_api_key", "message": "Invalid API key"}), 403

        return fn(*args, **kwargs)
    return wrapper