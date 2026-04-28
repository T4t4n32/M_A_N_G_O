from datetime import datetime
from flask import Blueprint, request, jsonify
from app.database import db
from app.models.content import EditableContent
from app.middleware.admin_required import admin_required

admin_content_bp = Blueprint("admin_content", __name__, url_prefix="/api/v1/admin")


@admin_content_bp.route("/content", methods=["GET"])
@admin_required
def list_content():
    """GET /api/v1/admin/content — returns all editable text keys."""
    items = EditableContent.query.order_by(EditableContent.key).all()
    return jsonify([c.to_dict() for c in items]), 200


@admin_content_bp.route("/content/<string:key>", methods=["PUT"])
@admin_required
def update_content(key: str):
    """PUT /api/v1/admin/content/:key
    Body: { "value": str }
    """
    data = request.get_json(silent=True)
    if not data or "value" not in data:
        return jsonify({"error": "'value' field is required"}), 400

    record = EditableContent.query.get(key)
    if not record:
        return jsonify({"error": f"key '{key}' not found"}), 404

    record.value = str(data["value"])
    record.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(record.to_dict()), 200
