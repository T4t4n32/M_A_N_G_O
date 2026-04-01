"""
API de gestión de usuarios M.A.N.G.O.

Endpoints (url_prefix=/api/v1/users):
  POST  /register        → crear cuenta (admin o primer usuario)
  POST  /login           → login con sesión + registro histórico
  POST  /logout          → cierra sesión
  GET   /me              → perfil del usuario autenticado
  GET   /me/history      → historial de logins del usuario actual
  GET   /                → listar usuarios (solo admin)
  PATCH /<id>/role       → cambiar rol (solo admin)
  PATCH /<id>/active     → activar/desactivar (solo admin)

Roles:
  admin   → acceso total
  viewer  → solo lectura del dashboard
"""

from __future__ import annotations

from datetime import datetime, timezone
from functools import wraps

from flask import Blueprint, jsonify, request, session

from app.extensions import db
from app.models.user import MangoLoginEvent, MangoUser

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _current_user() -> MangoUser | None:
    uid = session.get("user_id")
    if not uid:
        return None
    return MangoUser.query.get(uid)


def _require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _current_user()
        if not user or not user.active:
            return jsonify({"error": "unauthorized", "message": "Sesión requerida"}), 401
        return fn(*args, **kwargs)
    return wrapper


def _require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _current_user()
        if not user or not user.active:
            return jsonify({"error": "unauthorized"}), 401
        if user.role != "admin":
            return jsonify({"error": "forbidden", "message": "Solo administradores"}), 403
        return fn(*args, **kwargs)
    return wrapper


def _first_user_exists() -> bool:
    return db.session.query(MangoUser.id).first() is not None


# ------------------------------------------------------------------
# Registro
# ------------------------------------------------------------------

@users_bp.post("/register")
def register():
    """
    Crea un nuevo usuario.
    - Si no hay ningún usuario en la DB → primer registro es admin, sin restricciones.
    - Si ya hay usuarios → solo un admin autenticado puede crear nuevos usuarios.
    """
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name     = (data.get("name") or "").strip()
    role     = data.get("role", "viewer")

    if not email or not password:
        return jsonify({"error": "email y password son requeridos"}), 400

    if len(password) < 8:
        return jsonify({"error": "password debe tener al menos 8 caracteres"}), 400

    if role not in ("admin", "viewer"):
        role = "viewer"

    is_first = not _first_user_exists()

    if not is_first:
        # Solo admin puede crear usuarios después del primero
        current = _current_user()
        if not current or current.role != "admin":
            return jsonify({
                "error": "forbidden",
                "message": "Solo un administrador puede registrar nuevos usuarios",
            }), 403

    if MangoUser.query.filter_by(email=email).first():
        return jsonify({"error": "email ya registrado"}), 409

    user = MangoUser(
        email=email,
        name=name,
        role="admin" if is_first else role,
        active=True,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "ok":     True,
        "user":   user.to_dict(),
        "is_first": is_first,
    }), 201


# ------------------------------------------------------------------
# Login / Logout
# ------------------------------------------------------------------

@users_bp.post("/login")
def login():
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email y password requeridos"}), 400

    user = MangoUser.query.filter_by(email=email).first()

    # Registrar intento fallido
    if not user or not user.check_password(password):
        if user:
            event = MangoLoginEvent(
                user_id=user.id,
                ip=request.remote_addr,
                user_agent=request.headers.get("User-Agent"),
                success=False,
            )
            db.session.add(event)
            db.session.commit()
        return jsonify({"error": "Credenciales inválidas"}), 401

    if not user.active:
        return jsonify({"error": "Cuenta desactivada — contacta al administrador"}), 403

    # Login exitoso
    user.record_login(
        ip=request.remote_addr,
        user_agent=request.headers.get("User-Agent"),
    )
    db.session.commit()

    session["user_id"] = user.id
    session["user"]    = user.email   # compatibilidad con Lovable auth

    return jsonify({
        "ok":   True,
        "user": user.to_dict(),
    }), 200


@users_bp.post("/logout")
def logout():
    session.pop("user_id", None)
    session.pop("user",    None)
    return jsonify({"ok": True}), 200


# ------------------------------------------------------------------
# Perfil propio
# ------------------------------------------------------------------

@users_bp.get("/me")
@_require_auth
def me():
    user = _current_user()
    return jsonify(user.to_dict()), 200


@users_bp.get("/me/history")
@_require_auth
def my_history():
    user  = _current_user()
    limit = min(int(request.args.get("limit", 20)), 200)

    events = (
        MangoLoginEvent.query
        .filter_by(user_id=user.id)
        .order_by(MangoLoginEvent.ts.desc())
        .limit(limit)
        .all()
    )
    return jsonify({
        "user_id": user.id,
        "events":  [e.to_dict() for e in events],
    }), 200


# ------------------------------------------------------------------
# Admin: gestión de usuarios
# ------------------------------------------------------------------

@users_bp.get("/")
@_require_admin
def list_users():
    users = MangoUser.query.order_by(MangoUser.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200


@users_bp.get("/<int:user_id>/history")
@_require_admin
def user_history(user_id: int):
    user = MangoUser.query.get_or_404(user_id)
    limit = min(int(request.args.get("limit", 50)), 500)

    events = (
        MangoLoginEvent.query
        .filter_by(user_id=user.id)
        .order_by(MangoLoginEvent.ts.desc())
        .limit(limit)
        .all()
    )
    return jsonify({
        "user":   user.to_dict(),
        "events": [e.to_dict() for e in events],
    }), 200


@users_bp.patch("/<int:user_id>/role")
@_require_admin
def change_role(user_id: int):
    user = MangoUser.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}
    role = data.get("role")

    if role not in ("admin", "viewer"):
        return jsonify({"error": "role debe ser 'admin' o 'viewer'"}), 400

    current = _current_user()
    if user.id == current.id:
        return jsonify({"error": "No puedes cambiar tu propio rol"}), 400

    user.role = role
    db.session.commit()
    return jsonify({"ok": True, "user": user.to_dict()}), 200


@users_bp.patch("/<int:user_id>/active")
@_require_admin
def toggle_active(user_id: int):
    user = MangoUser.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    current = _current_user()
    if user.id == current.id:
        return jsonify({"error": "No puedes desactivarte a ti mismo"}), 400

    user.active = bool(data.get("active", not user.active))
    db.session.commit()
    return jsonify({"ok": True, "user": user.to_dict()}), 200