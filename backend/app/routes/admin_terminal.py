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
import subprocess
import time
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
            command,
            shell=True,
            executable="/bin/bash",
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
    except Exception as e:
        log.exception("local exec error: %s", e)
        return {"stdout": "", "stderr": str(e), "returncode": 1}


def _run_jetson(command: str) -> dict:
    """
    Reach the Jetson via ProxyJump:
      container → VPS sshd (172.20.0.1:5972) → 127.0.0.1:9200 (reverse tunnel) → Jetson

    The container can reach port 5972 (public SSH) but not the tunnel port (127.0.0.1:9200)
    directly. We open a direct-tcpip channel from the VPS to its own loopback tunnel port.
    """
    key_path = os.environ.get("JETSON_SSH_KEY_PATH", "")
    jetson_user = os.environ.get("JETSON_USER", "ubuntu")
    jetson_port = int(os.environ.get("JETSON_PORT", "9200"))

    # VPS jump-host settings (reachable from Docker containers via public SSH port)
    vps_host = os.environ.get("VPS_JUMP_HOST", "172.20.0.1")
    vps_port = int(os.environ.get("VPS_SSH_PORT", "5972"))
    vps_user = os.environ.get("VPS_JUMP_USER", "mango")

    try:
        import paramiko  # type: ignore
    except ImportError:
        return {"stdout": "", "stderr": "paramiko no instalado", "returncode": 1}

    if not key_path or not os.path.exists(key_path):
        return {"stdout": "", "stderr": "Clave SSH no encontrada en {}".format(key_path), "returncode": 1}

    jump = paramiko.SSHClient()
    jump.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    jetson = paramiko.SSHClient()
    jetson.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        # Step 1: SSH into VPS jump host
        jump.connect(vps_host, port=vps_port, username=vps_user,
                     key_filename=key_path, timeout=10)

        # Step 2: Open a TCP channel from VPS → localhost:9200 (the reverse tunnel)
        transport = jump.get_transport()
        channel = transport.open_channel(
            "direct-tcpip",
            ("127.0.0.1", jetson_port),
            ("127.0.0.1", 0),
            timeout=10,
        )

        # Step 3: SSH to Jetson through the channel
        jetson.connect("127.0.0.1", username=jetson_user,
                       key_filename=key_path, sock=channel, timeout=10)

        _, stdout, stderr = jetson.exec_command(command, timeout=_TIMEOUT)
        exit_code = stdout.channel.recv_exit_status()
        return {
            "stdout": stdout.read().decode("utf-8", errors="replace")[-_MAX_OUTPUT:],
            "stderr": stderr.read().decode("utf-8", errors="replace")[-_MAX_OUTPUT:],
            "returncode": exit_code,
        }
    except Exception as e:
        log.exception("jetson proxyjump error: %s", e)
        return {"stdout": "", "stderr": "SSH error: {}".format(e), "returncode": 1}
    finally:
        jetson.close()
        jump.close()


_jetson_status_cache: dict = {"online": False, "ts": 0.0}
_JETSON_STATUS_TTL = 30  # seconds


def _probe_jetson_tunnel() -> bool:
    """Try to open a direct-tcpip channel through the VPS jump host to port 9200.
    Returns True if the Jetson reverse tunnel is listening."""
    key_path = os.environ.get("JETSON_SSH_KEY_PATH", "")
    jetson_port = int(os.environ.get("JETSON_PORT", "9200"))
    vps_host = os.environ.get("VPS_JUMP_HOST", "172.20.0.1")
    vps_port = int(os.environ.get("VPS_SSH_PORT", "5972"))
    vps_user = os.environ.get("VPS_JUMP_USER", "mango")

    try:
        import paramiko  # type: ignore
    except ImportError:
        return False

    if not key_path or not os.path.exists(key_path):
        return False

    jump = paramiko.SSHClient()
    jump.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        jump.connect(vps_host, port=vps_port, username=vps_user,
                     key_filename=key_path, timeout=5)
        transport = jump.get_transport()
        chan = transport.open_channel(
            "direct-tcpip", ("127.0.0.1", jetson_port), ("127.0.0.1", 0), timeout=3,
        )
        chan.close()
        return True
    except Exception:
        return False
    finally:
        try:
            jump.close()
        except Exception:
            pass


@admin_terminal_bp.get("/jetson/status")
@_require_admin
def jetson_status():
    now = time.monotonic()
    if now - _jetson_status_cache["ts"] > _JETSON_STATUS_TTL:
        online = _probe_jetson_tunnel()
        _jetson_status_cache["online"] = online
        _jetson_status_cache["ts"] = now
    return jsonify({"online": _jetson_status_cache["online"]}), 200


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
