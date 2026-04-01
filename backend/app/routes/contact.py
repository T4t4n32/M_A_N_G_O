"""
POST /api/v1/contact

Recibe el formulario de contacto del frontend y envía
un email a los destinatarios configurados.
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.services.email_service import send_contact_email

contact_bp = Blueprint("contact", __name__, url_prefix="/api/v1")


@contact_bp.post("/contact")
def contact():
    data = request.get_json(silent=True) or {}

    name    = (data.get("name")    or "").strip()
    email   = (data.get("email")   or "").strip()
    subject = (data.get("subject") or "Mensaje desde el sitio web").strip()
    message = (data.get("message") or "").strip()

    if not name or not email or not message:
        return jsonify({
            "error": "Faltan campos requeridos: name, email, message"
        }), 400

    if "@" not in email:
        return jsonify({"error": "Email inválido"}), 400

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