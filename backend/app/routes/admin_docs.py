import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.database import db
from app.models.document import Document, ALLOWED_EXTENSIONS
from app.middleware.admin_required import admin_required

admin_docs_bp = Blueprint("admin_docs", __name__, url_prefix="/api/v1/admin")

ALLOWED_MIME = {
    "application/pdf",
    "text/markdown",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _allowed_file(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED_EXTENSIONS


@admin_docs_bp.route("/docs", methods=["GET"])
@admin_required
def list_docs():
    """GET /api/v1/admin/docs"""
    docs = Document.query.order_by(Document.uploaded_at.desc()).all()
    return jsonify([d.to_dict() for d in docs]), 200


@admin_docs_bp.route("/docs", methods=["POST"])
@admin_required
def upload_doc():
    """POST /api/v1/admin/docs — multipart/form-data: file"""
    file = request.files.get("file")
    if not file or file.filename == "":
        return jsonify({"error": "no file provided"}), 400

    if not _allowed_file(file.filename):
        return jsonify({"error": f"file type not allowed — accepted: {', '.join(ALLOWED_EXTENSIONS)}"}), 415

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > current_app.config["MAX_CONTENT_LENGTH_DOCS"]:
        return jsonify({"error": "file exceeds 20 MB limit"}), 413

    ext = os.path.splitext(secure_filename(file.filename))[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    folder = current_app.config["UPLOAD_FOLDER_DOCS"]
    os.makedirs(folder, exist_ok=True)
    file.save(os.path.join(folder, unique_name))

    url = f"/uploads/docs/{unique_name}"
    record = Document(
        filename=file.filename,
        url=url,
        size=size,
        mime_type=file.mimetype,
    )
    db.session.add(record)
    db.session.commit()

    return jsonify({"id": record.id, "url": url, "filename": file.filename}), 201


@admin_docs_bp.route("/docs/<int:doc_id>", methods=["DELETE"])
@admin_required
def delete_doc(doc_id: int):
    """DELETE /api/v1/admin/docs/:id"""
    record = Document.query.get_or_404(doc_id)
    file_path = os.path.join(current_app.config["UPLOAD_FOLDER_DOCS"],
                             os.path.basename(record.url))
    if os.path.exists(file_path):
        os.remove(file_path)
    db.session.delete(record)
    db.session.commit()
    return jsonify({"success": True}), 200
