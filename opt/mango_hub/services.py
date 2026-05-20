"""Service management — auto-selects backend based on MANGO_HUB_MODE.

  MANGO_HUB_MODE=vps    -> Docker  (services_docker.py)
  MANGO_HUB_MODE=jetson -> Upstart initctl  (default)
"""

import os
import subprocess

from . import config

_MODE = os.getenv("MANGO_HUB_MODE", "jetson")

if _MODE == "vps":
    from .services_docker import (           # noqa: F401
        list_services, start_service, stop_service,
        restart_service, service_status,
    )
else:
    def _run(cmd):
        try:
            out = subprocess.check_output(
                cmd, stderr=subprocess.STDOUT
            ).decode("utf-8", "ignore").strip()
            return True, out
        except subprocess.CalledProcessError as e:
            return False, e.output.decode("utf-8", "ignore").strip()
        except Exception as e:
            return False, str(e)

    def service_status(name):
        ok, out = _run(["sudo", "initctl", "status", name])
        if not ok:
            return "unknown", None
        lower = out.lower()
        if "start/running" in lower or "running" in lower:
            pid = None
            for part in out.split():
                if part.isdigit():
                    pid = int(part)
                    break
            return "running", pid
        if "stop/waiting" in lower or "stopped" in lower:
            return "stopped", None
        return out.split()[0] if out else "unknown", None

    def list_services():
        result = []
        for name in config.MANAGED_SERVICES:
            status, pid = service_status(name)
            result.append({"name": name, "status": status, "pid": pid})
        return result

    def start_service(name):
        return _run(["sudo", "initctl", "start", name])

    def stop_service(name):
        return _run(["sudo", "initctl", "stop", name])

    def restart_service(name):
        ok, out = _run(["sudo", "initctl", "restart", name])
        if not ok and "Unknown instance" in out:
            return _run(["sudo", "initctl", "start", name])
        return ok, out
