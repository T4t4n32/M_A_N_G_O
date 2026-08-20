"""
Servicio de email para el formulario de contacto.

Usa SMTP con Gmail (o cualquier proveedor compatible).
Configurar en .env:
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=tu@gmail.com
    SMTP_PASSWORD=tu_app_password   ← generar en Google > Seguridad > Contraseñas de app
    CONTACT_RECIPIENTS=mango.monitoring@integramosoe.com,ssch200913@gmail.com
"""

from __future__ import annotations

import html
import os
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List

MAX_NAME_LENGTH = 100
MAX_EMAIL_LENGTH = 254
MAX_SUBJECT_LENGTH = 200
MAX_MESSAGE_LENGTH = 5000

_EMAIL_RE = re.compile(r"^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$")


def is_valid_email(value: str) -> bool:
    return (
        isinstance(value, str)
        and len(value) <= MAX_EMAIL_LENGTH
        and bool(_EMAIL_RE.fullmatch(value))
    )


def _strip_header(value: str) -> str:
    return value.replace("\r", "").replace("\n", "").strip()


def _get_config() -> dict:
    return {
        "host":       os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port":       int(os.getenv("SMTP_PORT", "587")),
        "user":       os.getenv("SMTP_USER", ""),
        "password":   os.getenv("SMTP_PASSWORD", ""),
        "recipients": [
            r.strip()
            for r in os.getenv(
                "CONTACT_RECIPIENTS",
                "mango.monitoring@integramosoe.com,ssch200913@gmail.com",
            ).split(",")
            if r.strip()
        ],
    }


def send_contact_email(
    sender_name: str,
    sender_email: str,
    subject: str,
    message: str,
) -> tuple[bool, str]:
    """
    Envía el formulario de contacto a los destinatarios configurados.
    Devuelve (True, "") en éxito o (False, error_message) en fallo.
    """
    sender_name = _strip_header(sender_name)
    sender_email = _strip_header(sender_email)
    subject = _strip_header(subject)
    if not (
        1 <= len(sender_name) <= MAX_NAME_LENGTH
        and is_valid_email(sender_email)
        and 1 <= len(subject) <= MAX_SUBJECT_LENGTH
        and 1 <= len(message) <= MAX_MESSAGE_LENGTH
    ):
        return False, "Datos de contacto inválidos"

    cfg = _get_config()

    if not cfg["user"] or not cfg["password"]:
        return False, "SMTP no configurado (faltan SMTP_USER / SMTP_PASSWORD)"

    escaped_name = html.escape(sender_name, quote=True)
    escaped_email = html.escape(sender_email, quote=True)
    escaped_subject = html.escape(subject, quote=True)
    escaped_message = html.escape(message, quote=True)
    escaped_message = escaped_message.replace("\r\n", "\n").replace("\r", "\n")
    body_html = f"""
    <html><body>
    <h2>Nuevo mensaje de contacto — M.A.N.G.O.</h2>
    <table>
      <tr><td><b>Nombre:</b></td><td>{escaped_name}</td></tr>
      <tr><td><b>Email:</b></td><td>{escaped_email}</td></tr>
      <tr><td><b>Asunto:</b></td><td>{escaped_subject}</td></tr>
    </table>
    <hr>
    <p>{escaped_message.replace(chr(10), '<br>')}</p>
    <hr>
    <small>Enviado desde integramosoe.com</small>
    </body></html>
    """

    body_text = (
        f"Nombre: {sender_name}\n"
        f"Email:  {sender_email}\n"
        f"Asunto: {subject}\n\n"
        f"{message}"
    )

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[MANGO Contacto] {subject}"
        msg["From"]    = f"{sender_name} via M.A.N.G.O. <{cfg['user']}>"
        msg["To"]      = ", ".join(cfg["recipients"])
        msg["Reply-To"] = sender_email

        msg.attach(MIMEText(body_text, "plain", "utf-8"))
        msg.attach(MIMEText(body_html,  "html",  "utf-8"))

        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(cfg["user"], cfg["password"])
            smtp.sendmail(cfg["user"], cfg["recipients"], msg.as_string())

        return True, ""

    except smtplib.SMTPAuthenticationError:
        return False, "Error de autenticación SMTP — revisa SMTP_USER y SMTP_PASSWORD"
    except smtplib.SMTPException as e:
        return False, f"SMTP error: {e}"
    except Exception as e:
        return False, f"Error inesperado: {e}"