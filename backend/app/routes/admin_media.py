import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from app.database import db
from app.models.media import Media, VALID_TYPES
from app.middleware.admin_required import admin_required

admin_media_bp = Blueprint("admin_media", __name__, url_prefix="/api/v1/admin")

ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"}
ALLOWED_VIDEO_MIME = {"video/mp4", "video/webm", "video/ogg", "video/quicktime"}


def _allowed_mime(mime: str, media_type: str) -> bool:
    if media_type == "image":
        return mime in ALLOWED_IMAGE_MIME
    if media_type == "video":
        return mime in ALLOWED_VIDEO_MIME
    return False


@admin_media_bp.route("/media", methods=["GET"])
@admin_required
def list_media():
    """GET /api/v1/admin/media?type=image|video"""
    media_type = request.args.get("type")
    query = Media.query
    if media_type in VALID_TYPES:
        query = query.filter_by(media_type=media_type)
    items = query.order_by(Media.uploaded_at.desc()).all()
    return jsonify([m.to_dict() for m in items]), 200


@admin_media_bp.route("/media", methods=["POST"])
@admin_required
def upload_media():
    """POST /api/v1/admin/media — multipart/form-data: file, type"""
    media_type = request.form.get("type")
    if media_type not in VALID_TYPES:
        return jsonify({"error": "type must be 'image' or 'video'"}), 400

    file = request.files.get("file")
    if not file or file.filename == "":
        return jsonify({"error": "no file provided"}), 400

    mime = file.mimetype
    if not _allowed_mime(mime, media_type):
        return jsonify({"error": f"mime type {mime} not allowed for {media_type}"}), 415

    # Size check
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    limit = (
        current_app.config["MAX_CONTENT_LENGTH_MEDIA"]
        if media_type == "image"
        else current_app.config["MAX_CONTENT_LENGTH_VIDEO"]
    )
    if size > limit:
        return jsonify({"error": "file exceeds size limit"}), 413

    ext = os.path.splitext(secure_filename(file.filename))[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    folder = current_app.config["UPLOAD_FOLDER_MEDIA"]
    os.makedirs(folder, exist_ok=True)
    file.save(os.path.join(folder, unique_name))

    url = f"/uploads/media/{unique_name}"
    record = Media(filename=file.filename, url=url, media_type=media_type, size=size, mime_type=mime)
    db.session.add(record)
    db.session.commit()

    return jsonify({"id": record.id, "url": url, "filename": file.filename}), 201


@admin_media_bp.route("/media/<int:media_id>", methods=["DELETE"])
@admin_required
def delete_media(media_id: int):
    """DELETE /api/v1/admin/media/:id"""
    record = Media.query.get_or_404(media_id)
    file_path = os.path.join(current_app.config["UPLOAD_FOLDER_MEDIA"],
                             os.path.basename(record.url))
    if os.path.exists(file_path):
        os.remove(file_path)
    db.session.delete(record)
    db.session.commit()
    return jsonify({"success": True}), 200
