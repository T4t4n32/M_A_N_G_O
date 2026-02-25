"""Route registration for M.A.N.G.O. (Additive, robust)

Rule from user: SUMA, NO QUITES.

What this file does:
- Registers a safe, minimal health endpoint (health_compat) so Docker healthchecks
  and Nginx can rely on it.
- Registers compatibility endpoints for ingest/latest (compat_ingest) so the
  dashboard/bridge have stable URLs.
- Auto-discovers and registers any other Blueprints present in this package
  (app.routes.*) without needing to hardcode their names.

If any module fails to import (missing optional deps), it is skipped, so the
backend still starts.
"""

from __future__ import annotations

import importlib
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
            # Duplicate blueprint name or route collision. We skip to avoid breaking startup.
            log.warning("Skipping blueprint %s: %s", bp.name, e)
        except Exception as e:
            log.exception("Failed registering blueprint %s: %s", bp.name, e)

    # 1) Always attempt to register minimal health endpoints.
    try:
        from .health_compat import health_compat_bp, legacy_health_compat_bp  # type: ignore

        safe_register(health_compat_bp)
        safe_register(legacy_health_compat_bp)
    except Exception as e:
        log.exception("health_compat import/register failed: %s", e)

    # 2) Always attempt to register ingest/latest compatibility endpoints.
    try:
        from .compat_ingest import compat_bp  # type: ignore

        safe_register(compat_bp)
    except Exception as e:
        log.exception("compat_ingest import/register failed: %s", e)

    # 3) Auto-discover every module under app.routes and register any Blueprints found.
    pkg = __name__  # 'app.routes'
    for mod_name in _iter_route_modules():
        # Already handled explicitly above.
        if mod_name in {"health_compat", "compat_ingest"}:
            continue

        try:
            module = importlib.import_module(f"{pkg}.{mod_name}")
        except Exception as e:
            log.warning("Skipping routes module %s (import error): %s", mod_name, e)
            continue

        for bp in _find_blueprints(module):
            safe_register(bp)

    try:
        from .dashboard_api import dashboard_bp
        app.register_blueprint(dashboard_bp)
    except Exception:
        pass
