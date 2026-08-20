"""
POST /api/v1/contact

Recibe el formulario de contacto del frontend y envía
un email a los destinatarios configurados.
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.middleware.rate_limit_middleware import limiter
from app.services.email_service import (
    MAX_EMAIL_LENGTH,
    MAX_MESSAGE_LENGTH,
    MAX_NAME_LENGTH,
    MAX_SUBJECT_LENGTH,
    is_valid_email,
    send_contact_email,
)

contact_bp = Blueprint("contact", __name__, url_prefix="/api/v1")


@contact_bp.post("/contact")
@limiter.limit("5 per minute")
def contact():
    data = request.get_json(silent=True) or {}

    def _field(name: str) -> str:
        value = data.get(name)
        return value.strip() if isinstance(value, str) else ""

    name = _field("name")
    email = _field("email")
    subject = _field("subject") or "Mensaje desde el sitio web"
    message = _field("message")

    if not name or not email or not message:
        return jsonify({
            "error": "Faltan campos requeridos: name, email, message"
        }), 400

    if not is_valid_email(email):
        return jsonify({"error": "Email inválido"}), 400
    if (
        len(name) > MAX_NAME_LENGTH
        or len(email) > MAX_EMAIL_LENGTH
        or len(subject) > MAX_SUBJECT_LENGTH
        or len(message) > MAX_MESSAGE_LENGTH
    ):
        return jsonify({"error": "Los campos exceden la longitud máxima"}), 400

    ok, err = send_contact_email(name, email, subject, message)

    if ok:
        return jsonify({
            "ok":      True,
            "message": "Mensaje enviado correctamente",
        }), 200

    # Fallo de SMTP → loguear pero devolver éxito al usuario
    # (no exponer detalles del servidor al cliente)
    import logging
    logging.getLogger("mango.contact").error("Email send failed: %s", err)

    return jsonify({
        "ok":      False,
        "message": "No se pudo enviar el mensaje. Inténtalo más tarde.",
    }), 503