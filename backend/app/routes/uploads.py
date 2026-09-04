"""
Unified file upload + serving for Panel Emma (super-admin).

Admin (session role=admin):
  POST   /api/v1/admin/upload            multipart: file, kind?, title, category, description
  GET    /api/v1/admin/uploads           list all uploaded files  ?kind=image|video|document
  PATCH  /api/v1/admin/uploads/<id>      update title/description/category
  DELETE /api/v1/admin/uploads/<id>      delete file + DB record

Public:
  GET    /api/v1/uploads/<path:filename>  serve uploaded file
"""
from __future__ import annotations

import os
import uuid
from functools import wraps

from flask import Blueprint, current_app, jsonify, request, send_from_directory, session
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.uploaded_file import UploadedFile
from app.models.user import MangoUser

uploads_bp = Blueprint("uploads", __name__, url_prefix="/api/v1")


# ─── Auth ────────────────────────────────────────────────────────────────────

def _current_user() -> MangoUser | None:
    uid = session.get("user_id")
    return db.session.get(MangoUser, uid) if uid else None


def _require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        u = _current_user()
        if not u or not u.active:
            return jsonify({"error": "authentication required"}), 401
        if u.role != "admin":
            return jsonify({"error": "forbidden"}), 403
        return fn(*args, **kwargs)
    return wrapper


# ─── MIME / kind detection ───────────────────────────────────────────────────

_IMAGE_MIMES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "image/svg+xml", "image/avif", "image/bmp", "image/tiff",
    "image/heic", "image/heif", "image/x-icon", "image/vnd.microsoft.icon",
    "image/ico", "image/x-rgb", "image/x-bmp", "image/x-ms-bmp",
}
_IMAGE_EXTS = {
    "jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "tiff",
    "tif", "heic", "heif", "ico", "jfif", "pjpeg", "pjp",
}
_VIDEO_MIMES = {
    "video/mp4", "video/webm", "video/ogg", "video/quicktime",
    "video/x-msvideo", "video/x-matroska", "video/3gpp", "video/3gpp2",
    "video/x-flv", "video/x-ms-wmv", "video/mpeg", "video/x-m4v",
    "video/mp2t",
}
_VIDEO_EXTS = {
    "mp4", "webm", "ogg", "ogv", "mov", "m4v", "avi", "mkv",
    "3gp", "3g2", "flv", "wmv", "mpeg", "mpg", "ts",
}
_DOC_EXTS = {
    # Office documents
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "odt", "ods", "odp", "odg", "odf",
    # Text / markup
    "txt", "md", "rst", "csv", "tsv", "html", "htm", "xml",
    "json", "yaml", "yml", "toml", "ini", "cfg", "conf",
    # Archives
    "zip", "rar", "7z", "tar", "gz", "bz2", "xz", "zst",
    # Code / scripts (for sharing)
    "py", "js", "ts", "sh", "bat", "rb", "go", "rs", "cpp",
    "c", "h", "java", "kt", "swift", "php", "sql",
    # Design / misc
    "epub", "rtf", "tex",
}


def _detect_kind(file) -> str | None:
    mime = (file.mimetype or "").lower()
    ext = os.path.splitext(secure_filename(file.filename or ""))[1].lstrip(".").lower()

    # Image detection: MIME first, then extension
    if mime in _IMAGE_MIMES or mime.startswith("image/"):
        return "image"
    if ext in _IMAGE_EXTS:
        return "image"

    # Video detection
    if mime in _VIDEO_MIMES or mime.startswith("video/"):
        return "video"
    if ext in _VIDEO_EXTS:
        return "video"

    # Document / file detection
    if ext in _DOC_EXTS:
        return "document"
    if mime.startswith("application/") or mime.startswith("text/"):
        return "document"

    # Unknown types fall through to document so nothing is rejected silently
    return "document"


def _size_limit(kind: str) -> int:
    cfg = current_app.config
    return {
        "image":    cfg.get("MAX_UPLOAD_IMAGE_BYTES",  20  * 1024 * 1024),
        "video":    cfg.get("MAX_UPLOAD_VIDEO_BYTES",  500 * 1024 * 1024),
        "document": cfg.get("MAX_UPLOAD_DOC_BYTES",    50  * 1024 * 1024),
    }.get(kind, 20 * 1024 * 1024)


# ─── Admin endpoints ─────────────────────────────────────────────────────────

@uploads_bp.post("/admin/upload")
@_require_admin
def upload_file():
    file = request.files.get("file")
    if not file or file.filename == "":
        return jsonify({"error": "no file provided"}), 400

    kind = request.form.get("kind") or _detect_kind(file)
    if kind not in ("image", "video", "document"):
        return jsonify({"error": "cannot determine kind — pass kind=image|video|document"}), 400

    # Size check
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    limit = _size_limit(kind)
    if size > limit:
        mb = limit // (1024 * 1024)
        return jsonify({"error": f"file exceeds {mb} MB limit for {kind}"}), 413

    raw_ext = os.path.splitext(secure_filename(file.filename))[1].lower()
    # Normalize .jpg → .jpeg so nginx's static-file regex doesn't intercept the URL.
    # The regex matches .jpg/.png/.webp but not .jpeg/.jfif, so we canonicalize here.
    _EXT_REMAP = {".jpg": ".jpeg"}
    ext = _EXT_REMAP.get(raw_ext, raw_ext) or raw_ext
    stored_name = f"{uuid.uuid4().hex}{ext}"
    upload_dir = os.path.join(current_app.config.get("UPLOAD_FOLDER", "/app/uploads"), kind)
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, stored_name))

    url = f"/api/v1/uploads/{kind}/{stored_name}"
    record = UploadedFile(
        stored_name=stored_name,
        original_name=file.filename,
        url=url,
        kind=kind,
        title=(request.form.get("title") or "").strip() or file.filename,
        description=(request.form.get("description") or "").strip() or None,
        category=(request.form.get("category") or "").strip() or None,
        subcategory=(request.form.get("subcategory") or "").strip() or None,
        size=size,
        mime_type=file.mimetype or None,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@uploads_bp.get("/admin/uploads")
@_require_admin
def list_uploads():
    kind     = request.args.get("kind")
    category = request.args.get("category")
    page     = max(1, request.args.get("page",     1, type=int))
    per_page = request.args.get("per_page", 0, type=int)  # 0 = all (legacy)

    q = UploadedFile.query
    if kind in ("image", "video", "document"):
        q = q.filter_by(kind=kind)
    if category:
        q = q.filter_by(category=category)
    total = q.count()

    if per_page > 0:
        per_page = min(per_page, 200)
        items    = q.order_by(UploadedFile.uploaded_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        pages    = (total + per_page - 1) // per_page
        return jsonify({
            "items":    [i.to_dict() for i in items],
            "total":    total,
            "page":     page,
            "per_page": per_page,
            "pages":    pages,
        }), 200

    items = q.order_by(UploadedFile.uploaded_at.desc()).all()
    return jsonify({"items": [i.to_dict() for i in items], "total": total, "pages": 1}), 200


@uploads_bp.patch("/admin/uploads/<int:upload_id>")
@_require_admin
def patch_upload(upload_id: int):
    record = db.session.get(UploadedFile, upload_id)
    if not record:
        return jsonify({"error": "not found"}), 404
    data = request.get_json(silent=True) or {}
    if "title" in data:
        record.title = str(data["title"]).strip()
    if "description" in data:
        record.description = str(data["description"]).strip() or None
    if "category" in data:
        record.category = str(data["category"]).strip() or None
    if "subcategory" in data:
        record.subcategory = str(data["subcategory"]).strip() or None
    db.session.commit()
    return jsonify(record.to_dict()), 200


@uploads_bp.delete("/admin/uploads/<int:upload_id>")
@_require_admin
def delete_upload(upload_id: int):
    record = db.session.get(UploadedFile, upload_id)
    if not record:
        return jsonify({"error": "not found"}), 404
    upload_dir = current_app.config.get("UPLOAD_FOLDER", "/app/uploads")
    file_path = os.path.join(upload_dir, record.kind, record.stored_name)
    if os.path.exists(file_path):
        os.remove(file_path)
    db.session.delete(record)
    db.session.commit()
    return jsonify({"ok": True}), 200


# ─── Public media listing (images + videos, no auth) ─────────────────────────

@uploads_bp.get("/public/media")
def public_media():
    """Lists uploaded images and videos — no auth required."""
    kind     = request.args.get("kind")
    category = request.args.get("category")
    page     = max(1, request.args.get("page",     1, type=int))
    per_page = min(100, max(1, request.args.get("per_page", 50, type=int)))

    q = UploadedFile.query.filter(UploadedFile.kind.in_(["image", "video"]))
    if kind in ("image", "video"):
        q = q.filter_by(kind=kind)
    if category:
        q = q.filter_by(category=category)

    total = q.count()
    items = q.order_by(UploadedFile.uploaded_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    pages = (total + per_page - 1) // per_page if per_page else 1

    return jsonify({
        "items":    [i.to_dict() for i in items],
        "total":    total,
        "page":     page,
        "per_page": per_page,
        "pages":    pages,
    }), 200


# ─── Public document listing ────────────────────────────────────────────────

@uploads_bp.get("/public/docs")
def public_docs():
    """Protocolo Legal: la biblioteca pública de documentos está retirada.

    Se conserva la ruta para no romper a los clientes que aún la consultan,
    pero nunca expone documentos. La gestión de archivos vive en el panel
    autenticado.
    """
    return jsonify({"items": [], "total": 0}), 200


# ─── Public file serving ─────────────────────────────────────────────────────

@uploads_bp.get("/uploads/<path:filename>")
def serve_upload(filename: str):
    """Serve an uploaded file. Path format: <kind>/<stored_name>"""
    upload_dir = current_app.config.get("UPLOAD_FOLDER", "/app/uploads")
    parts = filename.split("/", 1)
    if len(parts) == 2:
        directory = os.path.join(upload_dir, parts[0])
        fname     = parts[1]
    else:
        directory = upload_dir
        fname     = parts[0]
    return send_from_directory(directory, fname)
