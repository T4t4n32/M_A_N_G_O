"""
API de usuarios M.A.N.G.O. — compatible con Lovable UI.

Endpoints que el frontend consume:
  GET   /api/v1/users/status            → estado de sesión actual
  POST  /api/v1/users/login             → iniciar sesión
  POST  /api/v1/users/logout            → cerrar sesión
  POST  /api/v1/users/register          → crear cuenta
  GET   /api/v1/users                   → listar (admin)
  GET   /api/v1/users/me                → perfil propio (incluye rango activo)
  GET   /api/v1/users/me/subscription   → suscripción activa propia
  GET   /api/v1/users/me/history        → historial de logins
  GET   /api/v1/users/<id>/subscription → suscripción de usuario (admin)
  GET   /api/v1/users/<id>/subscriptions/history → historial de suscripciones (admin)
  PATCH /api/v1/users/me/password        → cambiar password propio (autenticado)
  PATCH /api/v1/users/<id>/role         → cambiar rol (admin)
  PATCH /api/v1/users/<id>/active       → activar/desactivar (admin)
  PATCH /api/v1/users/<id>/password     → resetear password de otro usuario (admin)
  DELETE /api/v1/users/<id>             → eliminar usuario (admin)
"""

from __future__ import annotations

from datetime import datetime, timezone
from functools import wraps

from flask import Blueprint, jsonify, request, session

from app.extensions import db
from app.models.subscription import UserSubscription, tier_for_user
from app.models.user import MangoLoginEvent, MangoUser

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _current_user() -> MangoUser | None:
    uid = session.get("user_id")
    if not uid:
        return None
    return db.session.get(MangoUser, uid)


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
# Estado de sesión — el frontend lo llama al cargar la app
# ------------------------------------------------------------------

@users_bp.get("/status")
def status():
    user = _current_user()
    if not user or not user.active:
        return jsonify({"authenticated": False}), 200

    return jsonify({
        "authenticated": True,
        "user": {
            "id":    user.id,
            "email": user.email,
            "name":  user.name or user.email.split("@")[0],
            "role":  user.role,
            "tier":  tier_for_user(user),
        },
    }), 200


# ------------------------------------------------------------------
# Registro
# ------------------------------------------------------------------

@users_bp.post("/register")
def register():
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name     = (data.get("name") or "").strip()
    role     = data.get("role", "viewer")

    if not email or not password:
        return jsonify({"error": "email y password son requeridos"}), 400

    if len(password) < 8:
        return jsonify({"error": "El password debe tener al menos 8 caracteres"}), 400

    if role not in ("admin", "viewer"):
        role = "viewer"

    is_first = not _first_user_exists()

    if not is_first:
        current = _current_user()
        if not current or current.role != "admin":
            return jsonify({
                "error": "forbidden",
                "message": "Solo un administrador puede registrar nuevos usuarios",
            }), 403

    if MangoUser.query.filter_by(email=email).first():
        return jsonify({"error": "El email ya está registrado"}), 409

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
        "ok":       True,
        "user":     user.to_dict(),
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

    user.record_login(
        ip=request.remote_addr,
        user_agent=request.headers.get("User-Agent"),
    )
    db.session.commit()

    # Guardar en sesión — ambas claves para compatibilidad con lovable_auth
    session["user_id"] = user.id
    session["user"]    = user.email
    session["role"]    = user.role
    session.permanent  = True

    return jsonify({
        "ok":   True,
        "user": {
            "id":    user.id,
            "email": user.email,
            "name":  user.name or user.email.split("@")[0],
            "role":  user.role,
        },
    }), 200


@users_bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"ok": True}), 200


# ------------------------------------------------------------------
# Perfil propio
# ------------------------------------------------------------------

@users_bp.get("/me")
@_require_auth
def me():
    user = _current_user()
    data = user.to_dict()
    data["tier"] = tier_for_user(user)
    return jsonify(data), 200


@users_bp.get("/me/subscription")
@_require_auth
def me_subscription():
    user = _current_user()
    sub  = UserSubscription.active_for_user(user.id)
    if not sub:
        return jsonify({
            "active": False,
            "tier":   tier_for_user(user),
        }), 200
    return jsonify({"active": True, **sub.to_dict()}), 200


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
    return jsonify([u.to_dict() for u in users]), 200


@users_bp.get("/<int:user_id>/history")
@_require_admin
def user_history(user_id: int):
    user  = db.get_or_404(MangoUser, user_id)
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
    user    = db.get_or_404(MangoUser, user_id)
    data    = request.get_json(silent=True) or {}
    role    = data.get("role")
    current = _current_user()

    if role not in ("admin", "viewer"):
        return jsonify({"error": "role debe ser 'admin' o 'viewer'"}), 400
    if user.id == current.id:
        return jsonify({"error": "No puedes cambiar tu propio rol"}), 400

    user.role = role
    db.session.commit()
    return jsonify({"ok": True, "user": user.to_dict()}), 200


@users_bp.patch("/<int:user_id>/active")
@_require_admin
def toggle_active(user_id: int):
    user    = db.get_or_404(MangoUser, user_id)
    data    = request.get_json(silent=True) or {}
    current = _current_user()

    if user.id == current.id:
        return jsonify({"error": "No puedes desactivarte a ti mismo"}), 400

    user.active = bool(data.get("active", not user.active))
    db.session.commit()
    return jsonify({"ok": True, "user": user.to_dict()}), 200


@users_bp.delete("/<int:user_id>")
@_require_admin
def delete_user(user_id: int):
    user    = db.get_or_404(MangoUser, user_id)
    current = _current_user()

    if user.id == current.id:
        return jsonify({"error": "No puedes eliminarte a ti mismo"}), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({"ok": True, "deleted_id": user_id}), 200


# ------------------------------------------------------------------
# Password management
# ------------------------------------------------------------------

@users_bp.patch("/me/password")
@_require_auth
def change_own_password():
    user    = _current_user()
    data    = request.get_json(silent=True) or {}
    current_pw = data.get("current_password") or ""
    new_pw     = data.get("new_password") or ""

    if not current_pw or not new_pw:
        return jsonify({"error": "current_password y new_password son requeridos"}), 400
    if not user.check_password(current_pw):
        return jsonify({"error": "La contraseña actual es incorrecta"}), 401
    if len(new_pw) < 8:
        return jsonify({"error": "La nueva contraseña debe tener al menos 8 caracteres"}), 400

    user.set_password(new_pw)
    db.session.commit()
    return jsonify({"ok": True}), 200


@users_bp.patch("/<int:user_id>/password")
@_require_admin
def reset_user_password(user_id: int):
    user    = db.get_or_404(MangoUser, user_id)
    data    = request.get_json(silent=True) or {}
    new_pw  = data.get("new_password") or ""

    if not new_pw:
        return jsonify({"error": "new_password es requerido"}), 400
    if len(new_pw) < 8:
        return jsonify({"error": "El password debe tener al menos 8 caracteres"}), 400

    user.set_password(new_pw)
    db.session.commit()
    return jsonify({"ok": True, "user_id": user_id}), 200


# ------------------------------------------------------------------
# Admin: suscripciones por usuario
# ------------------------------------------------------------------

@users_bp.get("/<int:user_id>/subscription")
@_require_admin
def user_subscription(user_id: int):
    user = db.get_or_404(MangoUser, user_id)
    sub  = UserSubscription.active_for_user(user.id)
    if not sub:
        return jsonify({
            "active": False,
            "tier":   tier_for_user(user),
            "user":   user.to_dict(),
        }), 200
    return jsonify({
        "active": True,
        "user":   user.to_dict(),
        **sub.to_dict(),
    }), 200


@users_bp.get("/<int:user_id>/subscriptions/history")
@_require_admin
def user_subscription_history(user_id: int):
    user  = db.get_or_404(MangoUser, user_id)
    limit = min(int(request.args.get("limit", 50)), 200)
    subs  = UserSubscription.history_for_user(user.id, limit=limit)
    return jsonify({
        "user":          user.to_dict(),
        "subscriptions": [s.to_dict() for s in subs],
    }), 200