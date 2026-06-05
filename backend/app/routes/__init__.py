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

    # Editable content keys (/api/v1/admin/content/*)
    try:
        from .admin_content import admin_content_bp
        safe_register(admin_content_bp)
    except Exception as e:
        log.exception("admin_content import failed: %s", e)

    # Contact form (/api/v1/contact)
    try:
        from .contact import contact_bp
        safe_register(contact_bp)
    except Exception as e:
        log.exception("contact import failed: %s", e)

    # Station management (/api/v1/stations/*)
    try:
        from .stations import stations_mgmt_bp
        safe_register(stations_mgmt_bp)
    except Exception as e:
        log.warning("stations not loaded: %s", e)

    # Alert rules, contacts, and event log (/api/v1/alerts/*)
    try:
        from .alerts import alerts_bp
        safe_register(alerts_bp)
    except Exception as e:
        log.exception("alerts import failed: %s", e)

    # Admin terminal exec (/api/v1/admin/exec)
    try:
        from .admin_terminal import admin_terminal_bp
        safe_register(admin_terminal_bp)
    except Exception as e:
        log.exception("admin_terminal import failed: %s", e)

    # Access requests — tier upgrade flow (/api/v1/access-requests)
    try:
        from .access_requests import access_requests_bp
        safe_register(access_requests_bp)
    except Exception as e:
        log.exception("access_requests import failed: %s", e)

    # SSE real-time stream (/api/v1/stream)
    try:
        from .stream import stream_bp
        safe_register(stream_bp)
    except Exception as e:
        log.exception("stream import failed: %s", e)

    # Lovable auth alias (/api/v1/auth/status|login|logout)
    try:
        from .lovable_auth import auth_bp
        safe_register(auth_bp)
    except Exception as e:
        log.warning("lovable_auth not loaded (optional): %s", e)

    # Readings + sensor status (/api/v1/readings/*, /api/v1/sensors/status)
    try:
        from .readings import readings_bp
        safe_register(readings_bp)
    except Exception as e:
        log.exception("readings import failed: %s", e)

    # Device registry (/api/v1/devices/*)
    try:
        from .devices import devices_bp
        safe_register(devices_bp)
    except Exception as e:
        log.exception("devices import failed: %s", e)

    # Sync coordination (/api/v1/sync/*)
    try:
        from .sync_api import sync_bp
        safe_register(sync_bp)
    except Exception as e:
        log.exception("sync_api import failed: %s", e)

    # Secure temporary download links + activity log (/api/v1/docs/*)
    try:
        from .docs_download import docs_download_bp
        safe_register(docs_download_bp)
    except Exception as e:
        log.exception("docs_download import failed: %s", e)

    # Mission lifecycle (/api/v1/missions/*)
    try:
        from .missions import missions_bp
        safe_register(missions_bp)
    except Exception as e:
        log.exception("missions import failed: %s", e)

    # Command queue (/api/v1/commands/*)
    try:
        from .commands import commands_bp
        safe_register(commands_bp)
    except Exception as e:
        log.exception("commands import failed: %s", e)

    # File uploads + serving (/api/v1/admin/upload, /api/v1/uploads/*)
    try:
        from .uploads import uploads_bp
        safe_register(uploads_bp)
    except Exception as e:
        log.exception("uploads import failed: %s", e)
