"""Admin terminal — remote command execution for VPS and Jetson.

POST /api/v1/admin/exec
  Body: { "command": str, "target": "vps" | "jetson" }
  Auth: admin session required
  Returns: { "stdout": str, "stderr": str, "returncode": int }

VPS commands run as a subprocess on the current host.
Jetson commands are forwarded via SSH (paramiko) when JETSON_HOST is set.
"""

from __future__ import annotations

import logging
import os
import shlex
import subprocess
from functools import wraps

from flask import Blueprint, jsonify, request, session

log = logging.getLogger("mango.admin_terminal")

admin_terminal_bp = Blueprint("admin_terminal", __name__, url_prefix="/api/v1/admin")

# Maximum output retained (characters) to prevent response bloat
_MAX_OUTPUT = 8_000
# Command timeout in seconds
_TIMEOUT = 30


def _require_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({"error": "No autenticado"}), 401
        if session.get("role") != "admin":
            return jsonify({"error": "Acceso restringido a administradores"}), 403
        return f(*args, **kwargs)
    return wrapper


def _run_local(command: str) -> dict:
    try:
        result = subprocess.run(
            shlex.split(command),
            capture_output=True,
            text=True,
            timeout=_TIMEOUT,
        )
        return {
            "stdout": result.stdout[-_MAX_OUTPUT:],
            "stderr": result.stderr[-_MAX_OUTPUT:],
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"Timeout: el comando superó {_TIMEOUT}s", "returncode": 124}
    except FileNotFoundError as e:
        return {"stdout": "", "stderr": f"Comando no encontrado: {e}", "returncode": 127}
    except Exception as e:
        log.exception("local exec error: %s", e)
        return {"stdout": "", "stderr": str(e), "returncode": 1}


def _run_jetson(command: str) -> dict:
    host = os.environ.get("JETSON_HOST", "").strip()
    if not host:
        return {
            "stdout": "",
            "stderr": "JETSON_HOST no configurado — conecta el Jetson primero",
            "returncode": 1,
        }

    user = os.environ.get("JETSON_USER", "ubuntu")
    key_path = os.environ.get("JETSON_SSH_KEY_PATH", "")

    try:
        import paramiko  # type: ignore
    except ImportError:
        return {
            "stdout": "",
            "stderr": "paramiko no está instalado en el backend",
            "returncode": 1,
        }

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        connect_kwargs: dict = {"hostname": host, "username": user, "timeout": 10}
        if key_path and os.path.exists(key_path):
            connect_kwargs["key_filename"] = key_path
        client.connect(**connect_kwargs)
        _, stdout, stderr = client.exec_command(command, timeout=_TIMEOUT)
        stdout.channel.recv_exit_status()
        return {
            "stdout": stdout.read().decode("utf-8", errors="replace")[-_MAX_OUTPUT:],
            "stderr": stderr.read().decode("utf-8", errors="replace")[-_MAX_OUTPUT:],
            "returncode": stdout.channel.recv_exit_status(),
        }
    except Exception as e:
        log.exception("jetson ssh error: %s", e)
        return {"stdout": "", "stderr": f"SSH error: {e}", "returncode": 1}
    finally:
        client.close()


@admin_terminal_bp.post("/exec")
@_require_admin
def exec_command():
    body = request.get_json(silent=True) or {}
    command: str = (body.get("command") or "").strip()
    target: str = (body.get("target") or "vps").strip()

    if not command:
        return jsonify({"error": "Campo 'command' requerido"}), 400
    if target not in ("vps", "jetson"):
        return jsonify({"error": "target debe ser 'vps' o 'jetson'"}), 400

    log.info("admin exec [%s] by user=%s: %r", target, session.get("user_id"), command)

    if target == "vps":
        result = _run_local(command)
    else:
        result = _run_jetson(command)

    return jsonify(result), 200
