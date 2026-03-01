# routes legacy / future modules

These modules exist in the repo but are NOT registered by default to keep startup stable.

Recommended actions:
- Move legacy modules into a folder that starts with "_" (example: _legacy/) so they are never auto-imported.
- Keep them for reference.

Suggested legacy list:
- api.py            (SQLite-only, old get_db_connection)
- data.py           (duplicate ingest without /api/v1 prefix)
- sensors_data.py   (in-memory store, not persistent)
- auth.py, sensors.py (JWT/RestX heavy deps, future SaaS)
- health_compat.py  (duplicate /api/v1/health)
- lovable_compat.py (duplicate endpoints; dashboard_api now provides Lovable-friendly fields)
- admin.py, institutions.py, public.py, websocket.py (empty stubs)
