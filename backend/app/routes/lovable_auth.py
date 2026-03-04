"""Compatibility wrapper (ADD-ONLY).

Your routes registry imports:
  from .lovable_auth import auth_bp

The real implementation lives in app.routes_old.lovable_auth.
"""

from app.routes_old.lovable_auth import auth_bp  # noqa: F401
