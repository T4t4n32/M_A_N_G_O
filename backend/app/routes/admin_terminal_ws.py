"""WebSocket interactive terminals for VPS (PTY) and Jetson (paramiko).

Routes (registered on the Sock instance created in create_app):
  WS /api/v1/admin/terminal/vps     — bash PTY on this host
  WS /api/v1/admin/terminal/jetson  — interactive shell via ProxyJump SSH
"""

from __future__ import annotations

import fcntl
import logging
import os
import pty
import select
import struct
import termios
import threading
import json

from flask import session

log = logging.getLogger("mango.terminal_ws")

_MAX = 8192


def _is_admin() -> bool:
    return bool(session.get("user_id")) and session.get("role") == "admin"


def _set_pty_size(fd: int, cols: int, rows: int) -> None:
    try:
        fcntl.ioctl(fd, termios.TIOCSWINSZ,
                    struct.pack("HHHH", rows, cols, 0, 0))
    except OSError:
        log.warning("Could not resize PTY to %sx%s", cols, rows, exc_info=True)


def _parse_resize(msg: str):
    """Return (cols, rows) if msg is a resize JSON, else None."""
    try:
        d = json.loads(msg)
    except ValueError:
        # Ordinary keystrokes are not JSON; nothing to report.
        return None
    if isinstance(d, dict) and d.get("type") == "resize":
        try:
            return int(d["cols"]), int(d["rows"])
        except (KeyError, TypeError, ValueError):
            log.warning("Ignoring malformed resize message: %r", msg[:200])
    return None


# ── VPS terminal (real bash PTY) ────────────────────────────────────────────

def vps_terminal_handler(ws):
    if not _is_admin():
        ws.send("\r\n\x1b[31m[Acceso denegado — solo administradores]\x1b[0m\r\n")
        return

    pid, fd = pty.fork()

    if pid == 0:
        # Child: exec a login bash with a nice prompt
        env = {**os.environ,
               "TERM": "xterm-256color",
               "COLORTERM": "truecolor",
               "PS1": r"\[\e[38;5;82m\]vps\[\e[0m\]:\[\e[38;5;75m\]\w\[\e[0m\]\$ "}
        os.execvpe("/bin/bash", ["/bin/bash", "-l"], env)
        os._exit(1)

    # Parent: relay PTY ↔ WebSocket
    stop = threading.Event()

    def pty_to_ws():
        while not stop.is_set():
            try:
                r, _, _ = select.select([fd], [], [], 0.05)
                if r:
                    data = os.read(fd, _MAX)
                    if not data:
                        break
                    ws.send(data.decode("utf-8", errors="replace"))
            except OSError:
                break
            except Exception as e:
                log.debug("pty_to_ws error: %s", e)
                break
        stop.set()

    reader = threading.Thread(target=pty_to_ws, daemon=True)
    reader.start()

    try:
        while not stop.is_set():
            msg = ws.receive()
            if msg is None:
                break
            resize = _parse_resize(msg) if isinstance(msg, str) else None
            if resize:
                _set_pty_size(fd, *resize)
            else:
                payload = msg.encode("utf-8") if isinstance(msg, str) else msg
                os.write(fd, payload)
    except Exception as e:
        log.debug("ws receive error (vps): %s", e)
    finally:
        stop.set()
        try:
            os.kill(pid, 9)
        except OSError:
            pass
        try:
            os.waitpid(pid, 0)
        except OSError:
            pass
        try:
            os.close(fd)
        except OSError:
            pass


# ── Jetson terminal (paramiko ProxyJump + invoke_shell) ─────────────────────

def jetson_terminal_handler(ws):
    if not _is_admin():
        ws.send("\r\n\x1b[31m[Acceso denegado — solo administradores]\x1b[0m\r\n")
        return

    key_path    = os.environ.get("JETSON_SSH_KEY_PATH", "")
    jetson_user = os.environ.get("JETSON_USER", "ubuntu")
    jetson_port = int(os.environ.get("JETSON_PORT", "9200"))
    vps_host    = os.environ.get("VPS_JUMP_HOST", "172.20.0.1")
    vps_port    = int(os.environ.get("VPS_SSH_PORT", "5972"))
    vps_user    = os.environ.get("VPS_JUMP_USER", "mango")

    try:
        import paramiko
    except ImportError:
        ws.send("paramiko no instalado\r\n")
        return

    if not key_path or not os.path.exists(key_path):
        ws.send(f"\r\n\x1b[31mClave SSH no encontrada: {key_path}\x1b[0m\r\n")
        return

    jump   = paramiko.SSHClient()
    jump.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    jetson = paramiko.SSHClient()
    jetson.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    chan = None
    try:
        ws.send("\x1b[33mConectando a Jetson TK1 vía túnel...\x1b[0m\r\n")

        jump.connect(vps_host, port=vps_port, username=vps_user,
                     key_filename=key_path, timeout=10)

        transport = jump.get_transport()
        sock_to_jetson = transport.open_channel(
            "direct-tcpip", ("127.0.0.1", jetson_port),
            ("127.0.0.1", 0), timeout=10,
        )

        jetson.connect("127.0.0.1", username=jetson_user,
                       key_filename=key_path, sock=sock_to_jetson, timeout=10)

        chan = jetson.invoke_shell(term="xterm-256color", width=220, height=50)
        chan.setblocking(False)

        ws.send("\x1b[32mConectado a tegra-ubuntu\x1b[0m\r\n")

        stop = threading.Event()

        def ssh_to_ws():
            while not stop.is_set():
                try:
                    r, _, _ = select.select([chan], [], [], 0.05)
                    if r:
                        data = chan.recv(_MAX)
                        if not data:
                            break
                        ws.send(data.decode("utf-8", errors="replace"))
                except Exception as e:
                    log.debug("ssh_to_ws error: %s", e)
                    break
            stop.set()

        reader = threading.Thread(target=ssh_to_ws, daemon=True)
        reader.start()

        try:
            while not stop.is_set():
                msg = ws.receive()
                if msg is None:
                    break
                resize = _parse_resize(msg) if isinstance(msg, str) else None
                if resize:
                    cols, rows = resize
                    chan.resize_pty(width=cols, height=rows)
                else:
                    payload = msg.encode("utf-8") if isinstance(msg, str) else msg
                    chan.send(payload)
        except Exception as e:
            log.debug("ws receive error (jetson): %s", e)
        finally:
            stop.set()

    except Exception as e:
        log.exception("jetson terminal error: %s", e)
        ws.send(f"\r\n\x1b[31mError de conexión: {e}\x1b[0m\r\n")
    finally:
        if chan:
            try:
                chan.close()
            except Exception:
                pass
        try:
            jetson.close()
        except Exception:
            pass
        try:
            jump.close()
        except Exception:
            pass
