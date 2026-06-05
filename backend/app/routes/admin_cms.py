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
from app.models.uploaded_file import UploadedFile

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
        # content is the complete flat key-value map from the frontend.
        # Merge at top level — never wrap under a nested "content" key.
        if isinstance(content, dict):
            existing.update(content)
        else:
            return jsonify({"error": "'content' must be an object"}), 400
    if seo is not None:
        existing["__seo__"] = seo

    record.set_content(existing)
    db.session.commit()

    return jsonify({"ok": True, **record.to_dict()}), 200


@admin_cms_bp.get("/admin/media")
@_require_admin
def admin_list_media():
    kind = request.args.get("type", "")
    query = UploadedFile.query.filter(UploadedFile.kind.in_(["image", "video"]))
    if kind in ("image", "video"):
        query = query.filter_by(kind=kind)
    items = query.order_by(UploadedFile.uploaded_at.desc()).all()
    return jsonify({"media": [i.to_dict() for i in items], "type": kind or "all"}), 200


@admin_cms_bp.get("/admin/docs")
@_require_admin
def admin_list_docs():
    docs = (
        UploadedFile.query
        .filter_by(kind="document")
        .order_by(UploadedFile.uploaded_at.desc())
        .all()
    )
    return jsonify({"docs": [d.to_dict() for d in docs]}), 200
