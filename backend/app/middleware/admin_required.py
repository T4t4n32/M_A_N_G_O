from app.utils.auth import require_admin, require_auth

#: Decorator: requires an active session with role == 'admin'.
admin_required = require_admin(forbidden_error="forbidden — admin role required")

#: Decorator: requires an active session (any role).
login_required = require_auth()
