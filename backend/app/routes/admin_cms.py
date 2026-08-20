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

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.site_content import SiteContent
from app.models.uploaded_file import UploadedFile
from app.middleware.admin_required import admin_required

admin_cms_bp = Blueprint("admin_cms", __name__, url_prefix="/api/v1")


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
@admin_required
def admin_get_site_content():
    record = SiteContent.query.first()
    if not record:
        return jsonify({"content": {}, "updatedAt": None}), 200
    return jsonify(record.to_dict()), 200


@admin_cms_bp.put("/admin/site-content")
@admin_required
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
@admin_required
def admin_list_media():
    kind = request.args.get("type", "")
    query = UploadedFile.query.filter(UploadedFile.kind.in_(["image", "video"]))
    if kind in ("image", "video"):
        query = query.filter_by(kind=kind)
    items = query.order_by(UploadedFile.uploaded_at.desc()).all()
    return jsonify({"media": [i.to_dict() for i in items], "type": kind or "all"}), 200


@admin_cms_bp.get("/admin/docs")
@admin_required
def admin_list_docs():
    docs = (
        UploadedFile.query
        .filter_by(kind="document")
        .order_by(UploadedFile.uploaded_at.desc())
        .all()
    )
    return jsonify({"docs": [d.to_dict() for d in docs]}), 200
