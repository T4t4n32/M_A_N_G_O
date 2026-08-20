"""
Ingest API key authentication.

Usage:
    from app.auth_ingest import require_ingest_key

    @bp.post("/ingest")
    @require_ingest_key
    def ingest():
        ...

Set INGEST_API_KEY in the environment. If the variable is empty or not set,
requests are rejected unless INGEST_ALLOW_ANONYMOUS=1 is explicitly enabled
for local development.

Clients must send:
    X-Api-Key: <your key>
"""

from __future__ import annotations

import os
import logging
from functools import wraps

from flask import jsonify, request

from app.config import _truthy

log = logging.getLogger("mango.auth_ingest")


def _get_configured_key() -> str | None:
    key = os.getenv("INGEST_API_KEY", "").strip()
    return key if key else None


def _anonymous_ingest_allowed() -> bool:
    return _truthy(os.getenv("INGEST_ALLOW_ANONYMOUS", "0"))


def require_ingest_key(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        configured = _get_configured_key()

        if configured is None:
            if _anonymous_ingest_allowed():
                log.warning(
                    "INGEST_ALLOW_ANONYMOUS is active; ingest authentication is bypassed"
                )
                return fn(*args, **kwargs)
            return jsonify({
                "error": "ingest_not_configured",
                "message": "Ingest no configurado",
            }), 503

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