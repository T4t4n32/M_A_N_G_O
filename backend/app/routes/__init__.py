"""Routes package — deterministic blueprint registry for M.A.N.G.O."""

from __future__ import annotations

import logging
from typing import Set

from flask import Blueprint

log = logging.getLogger("mango.routes")


def register_routes(app) -> None:
    registered: Set[str] = set()

    def safe_register(bp: Blueprint) -> None:
        if bp.name in registered:
            return
        try:
            app.register_blueprint(bp)
            registered.add(bp.name)
        except ValueError as e:
            log.warning("Skipping blueprint %s: %s", bp.name, e)
        except Exception as e:
            log.exception("Failed registering blueprint %s: %s", bp.name, e)

    # Health
    try:
        from .health import health_bp
        safe_register(health_bp)
        try:
            from .health import legacy_health_bp
            safe_register(legacy_health_bp)
        except ImportError:
            pass
    except Exception as e:
        log.exception("health import failed: %s", e)

    # Ingest compat (gateway/bridge sensor data)
    try:
        from .compat_ingest import compat_bp
        safe_register(compat_bp)
    except Exception as e:
        log.exception("compat_ingest import failed: %s", e)

    # Dashboard read API (/metrics, /latest/by_type, /range, /stations)
    try:
        from .dashboard_api import dashboard_bp
        safe_register(dashboard_bp)
    except Exception as e:
        log.exception("dashboard_api import failed: %s", e)

    # User management (/api/v1/users/*)
    try:
        from .users import users_bp
        safe_register(users_bp)
    except Exception as e:
        log.exception("users import failed: %s", e)

    # Subscription tiers (/api/v1/subscriptions/*)
    try:
        from .subscriptions import subscriptions_bp
        safe_register(subscriptions_bp)
    except Exception as e:
        log.warning("subscriptions not loaded: %s", e)

    # CMS public + admin (/site-content, /admin/site-content, /admin/media, /admin/docs)
    try:
        from .admin_cms import admin_cms_bp
        safe_register(admin_cms_bp)
    except Exception as e:
        log.exception("admin_cms import failed: %s", e)

    # Contact form (/api/v1/contact)
    try:
        from .contact import contact_bp
        safe_register(contact_bp)
    except Exception as e:
        log.exception("contact import failed: %s", e)

    # Lovable auth alias (/api/v1/auth/status|login|logout)
    try:
        from .lovable_auth import auth_bp
        safe_register(auth_bp)
    except Exception as e:
        log.warning("lovable_auth not loaded (optional): %s", e)
