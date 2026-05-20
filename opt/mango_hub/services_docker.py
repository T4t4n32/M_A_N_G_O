"""VPS service management via Docker CLI.

Used when MANGO_HUB_MODE=vps. Manages the mango Docker stack
instead of Upstart services.
"""

import subprocess


VPS_SERVICES = [
    "mango_backend",
    "mango_db",
    "mango_redis",
    "mango_grafana",
]


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
    ok, out = _run(["docker", "inspect", "--format",
                    "{{.State.Status}} {{.State.Pid}}", name])
    if not ok:
        return "unknown", None
    parts = out.split()
    status = parts[0] if parts else "unknown"
    pid = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None
    if status == "running":
        return "running", pid
    return status, None


def list_services():
    result = []
    for name in VPS_SERVICES:
        status, pid = service_status(name)
        result.append({"name": name, "status": status, "pid": pid})
    return result


def start_service(name):
    return _run(["docker", "start", name])


def stop_service(name):
    return _run(["docker", "stop", name])


def restart_service(name):
    return _run(["docker", "restart", name])


def tunnel_jetson_connected(port=9200):
    """Return True if the Jetson reverse tunnel is active on the given port."""
    ok, out = _run(["ss", "-tlnp"])
    if not ok:
        return False
    return ":{}".format(port) in out
