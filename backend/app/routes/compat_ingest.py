"""Compatibility wrapper (ADD-ONLY).

Your routes registry imports:
  from .compat_ingest import compat_bp

The real implementation lives in app.routes_old.compat_ingest.
This wrapper keeps your folder structure clean without deleting legacy code.
"""

from app.routes_old.compat_ingest import compat_bp  # noqa: F401
