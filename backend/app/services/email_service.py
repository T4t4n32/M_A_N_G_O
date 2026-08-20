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

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List

log = logging.getLogger("mango.email")


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
    cfg = _get_config()

    if not cfg["user"] or not cfg["password"]:
        log.error("Contact email not sent: SMTP_USER/SMTP_PASSWORD are not configured")
        return False, "SMTP no configurado (faltan SMTP_USER / SMTP_PASSWORD)"

    body_html = f"""
    <html><body>
    <h2>Nuevo mensaje de contacto — M.A.N.G.O.</h2>
    <table>
      <tr><td><b>Nombre:</b></td><td>{sender_name}</td></tr>
      <tr><td><b>Email:</b></td><td>{sender_email}</td></tr>
      <tr><td><b>Asunto:</b></td><td>{subject}</td></tr>
    </table>
    <hr>
    <p>{message.replace(chr(10), '<br>')}</p>
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
        log.error("Contact email failed: SMTP authentication rejected for user=%s", cfg["user"])
        return False, "Error de autenticación SMTP — revisa SMTP_USER y SMTP_PASSWORD"
    except smtplib.SMTPException as e:
        log.error("Contact email failed via %s:%s", cfg["host"], cfg["port"], exc_info=True)
        return False, f"SMTP error: {e}"
    except Exception as e:
        log.exception("Contact email failed unexpectedly")
        return False, f"Error inesperado: {e}"