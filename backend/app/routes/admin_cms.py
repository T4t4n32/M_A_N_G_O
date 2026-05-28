"""
CMS endpoints para M.A.N.G.O.

Endpoints (url_prefix=/api/v1):

  Public:
    GET  /site-content         → contenido del sitio (para hidratación del frontend)

  Admin:
    GET  /admin/site-content   → mismo contenido + metadatos
    PUT  /admin/site-content   → actualizar contenido  body: { content, seo }
    GET  /admin/media          → listar archivos de media
    GET  /admin/docs           → listar documentos
"""

from __future__ import annotations

from functools import wraps

from flask import Blueprint, jsonify, request, session

from app.extensions import db
from app.models.site_content import SiteContent
from app.models.user import MangoUser
from app.models.media import Media, VALID_TYPES
from app.models.document import Document

admin_cms_bp = Blueprint("admin_cms", __name__, url_prefix="/api/v1")


# ------------------------------------------------------------------
# Auth helpers
# ------------------------------------------------------------------

def _current_user() -> MangoUser | None:
    uid = session.get("user_id")
    if not uid:
        return None
    return db.session.get(MangoUser, uid)


def _require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _current_user()
        if not user or not user.active:
            return jsonify({"error": "authentication required"}), 401
        if user.role != "admin":
            return jsonify({"error": "forbidden — admin role required"}), 403
        return fn(*args, **kwargs)
    return wrapper


# ------------------------------------------------------------------
# Public endpoint
# ------------------------------------------------------------------

@admin_cms_bp.get("/site-content")
def site_content_public():
    record = SiteContent.query.first()
    if not record:
        return jsonify({"content": {}, "updatedAt": None}), 200
    return jsonify(record.to_dict()), 200


# ------------------------------------------------------------------
# Admin endpoints
# ------------------------------------------------------------------

@admin_cms_bp.get("/admin/site-content")
@_require_admin
def admin_get_site_content():
    record = SiteContent.query.first()
    if not record:
        return jsonify({"content": {}, "updatedAt": None}), 200
    return jsonify(record.to_dict()), 200


@admin_cms_bp.put("/admin/site-content")
@_require_admin
def admin_put_site_content():
    data = request.get_json(silent=True) or {}

    content = data.get("content")
    seo     = data.get("seo")

    if content is None and seo is None:
        return jsonify({"error": "body must include 'content' or 'seo'"}), 400

    record = SiteContent.query.first()
    if not record:
        record = SiteContent()
        db.session.add(record)

    existing = record.get_content()
    if content is not None:
        existing["content"] = content
    if seo is not None:
        existing["seo"] = seo

    record.set_content(existing)
    db.session.commit()

    return jsonify({"ok": True, **record.to_dict()}), 200


@admin_cms_bp.get("/admin/media")
@_require_admin
def admin_list_media():
    media_type = request.args.get("type", "")
    query = Media.query
    if media_type in VALID_TYPES:
        query = query.filter_by(media_type=media_type)
    items = query.order_by(Media.uploaded_at.desc()).all()
    return jsonify({"media": [m.to_dict() for m in items], "type": media_type or "all"}), 200


@admin_cms_bp.get("/admin/docs")
@_require_admin
def admin_list_docs():
    docs = Document.query.order_by(Document.uploaded_at.desc()).all()
    return jsonify({"docs": [d.to_dict() for d in docs]}), 200
