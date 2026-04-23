"""Routes package entrypoint.

Goal: deterministic + clean startup.
- Register only the routes that are REQUIRED for field tests + UI (Lovable + legacy dashboard).
- Keep legacy/future modules in the folder, but do NOT auto-import them by default.

If you want auto-discovery (experimental), set:
  ENABLE_EXPERIMENTAL_ROUTES=1
"""

from __future__ import annotations

import importlib
import os
import logging
import pkgutil
from typing import Iterable, Set

from flask import Blueprint

log = logging.getLogger("mango.routes")


def _iter_route_modules() -> Iterable[str]:
    for m in pkgutil.iter_modules(__path__):
        name = m.name
        if name.startswith("_") or name == "__init__":
            continue
        yield name


def _find_blueprints(module) -> list[Blueprint]:
    out: list[Blueprint] = []
    for attr in dir(module):
        try:
            obj = getattr(module, attr)
        except Exception:
            continue
        if isinstance(obj, Blueprint):
            out.append(obj)
    return out


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

    # -----------------------
    # REQUIRED (field test)
    # -----------------------
    # Health endpoints (/api/v1/health + /health legacy)
    try:
        from .health import health_bp, legacy_health_bp  # type: ignore
        safe_register(health_bp)
        safe_register(legacy_health_bp)
    except Exception as e:
        log.exception("health import/register failed: %s", e)

    # Ingest + latest (compat storage tables used by bridge/gateway)
    try:
        from .compat_ingest import compat_bp  # type: ignore
        safe_register(compat_bp)
    except Exception as e:
        log.exception("compat_ingest import/register failed: %s", e)

    # Dashboard read API (/api/v1/metrics, /latest/by_type, /range)
    try:
        from .dashboard_api import dashboard_bp  # type: ignore
        safe_register(dashboard_bp)
    except Exception as e:
        log.exception("dashboard_api import/register failed: %s", e)

    # Lovable login endpoints (cookies)
    try:
        from .lovable_auth import auth_bp  # type: ignore
        safe_register(auth_bp)
    except Exception as e:
        log.warning("lovable_auth not loaded (optional): %s", e)

    # User management (register, login, history)
    try:
        from .users import users_bp
        safe_register(users_bp)
    except Exception as e:
        log.exception("users import/register failed: %s", e)
        
    # Contact form
    try:
        from .contact import contact_bp
        safe_register(contact_bp)
    except Exception as e:
        log.exception("contact import/register failed: %s", e)

    # Station + sensor registration/mapping (admin CRUD)
    try:
        from .stations import stations_mgmt_bp
        safe_register(stations_mgmt_bp)
    except Exception as e:
        log.exception("stations import/register failed: %s", e)

    # Subscription / tier management (admin CRUD)
    try:
        from .subscriptions import subscriptions_bp
        safe_register(subscriptions_bp)
    except Exception as e:
        log.exception("subscriptions import/register failed: %s", e)

    # -----------------------
    # OPTIONAL (experimental)
    # -----------------------
    if os.getenv("ENABLE_EXPERIMENTAL_ROUTES", "0").lower() in ("1", "true", "yes"):
        pkg = __name__
        # Avoid importing known legacy/conflicting modules by default
        deny = {
            "api", "data", "sensors_data", "auth", "sensors",
            "health_compat", "lovable_compat",
            "admin", "institutions", "public", "websocket",
        }
        for mod_name in _iter_route_modules():
            if mod_name in deny:
                continue
            try:
                module = importlib.import_module(f"{pkg}.{mod_name}")
            except Exception as e:
                log.warning("Skipping routes module %s (import error): %s", mod_name, e)
                continue
            for bp in _find_blueprints(module):
                safe_register(bp)
