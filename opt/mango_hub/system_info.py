"""System metrics collected from /proc and subprocess calls.

Designed for Python 3.4 on Ubuntu 14.04 / Jetson TK1.
All subprocess calls fall back gracefully — never raise to caller.
"""

import os
import subprocess
import time


def _read_proc_stat():
    with open("/proc/stat") as f:
        line = f.readline()
    parts = line.split()
    vals = [int(x) for x in parts[1:8]]
    user, nice, system, idle, iowait, irq, softirq = vals
    total = sum(vals)
    idle_total = idle + iowait
    return total, idle_total


def cpu_percent(interval=0.15):
    try:
        t1, i1 = _read_proc_stat()
        time.sleep(interval)
        t2, i2 = _read_proc_stat()
        dt = t2 - t1
        di = i2 - i1
        if dt == 0:
            return 0.0
        return round(100.0 * (1.0 - float(di) / dt), 1)
    except Exception:
        return 0.0


def mem_info():
    info = {}
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                parts = line.split()
                if len(parts) >= 2:
                    info[parts[0].rstrip(":")] = int(parts[1])
    except Exception:
        return {"total_mb": 0, "used_mb": 0, "available_mb": 0, "percent": 0.0}
    total     = info.get("MemTotal", 0)
    available = info.get("MemAvailable", info.get("MemFree", 0))
    used      = total - available
    pct       = round(100.0 * used / total, 1) if total else 0.0
    return {
        "total_mb":     total // 1024,
        "used_mb":      used // 1024,
        "available_mb": available // 1024,
        "percent":      pct,
    }


def disk_usage(path="/"):
    try:
        st    = os.statvfs(path)
        total = st.f_blocks * st.f_frsize
        free  = st.f_bavail * st.f_frsize
        used  = total - free
        pct   = round(100.0 * used / total, 1) if total else 0.0
        return {
            "total_gb": round(total / 1024.0 ** 3, 1),
            "used_gb":  round(used  / 1024.0 ** 3, 1),
            "free_gb":  round(free  / 1024.0 ** 3, 1),
            "percent":  pct,
        }
    except Exception:
        return {"total_gb": 0, "used_gb": 0, "free_gb": 0, "percent": 0.0}


def uptime_str():
    try:
        with open("/proc/uptime") as f:
            secs = float(f.read().split()[0])
        days  = int(secs // 86400); secs %= 86400
        hours = int(secs // 3600);  secs %= 3600
        mins  = int(secs // 60)
        if days:
            return "{}d {}h {}m".format(days, hours, mins)
        if hours:
            return "{}h {}m".format(hours, mins)
        return "{}m".format(mins)
    except Exception:
        return "?"


def load_avg():
    try:
        with open("/proc/loadavg") as f:
            parts = f.read().split()
        return parts[0], parts[1], parts[2]
    except Exception:
        return "?", "?", "?"


def network_info():
    try:
        raw = subprocess.check_output(
            ["ip", "addr"], stderr=subprocess.STDOUT
        ).decode("utf-8", "ignore")
    except Exception:
        try:
            raw = subprocess.check_output(
                ["ifconfig", "-a"], stderr=subprocess.STDOUT
            ).decode("utf-8", "ignore")
        except Exception:
            return []

    ifaces  = []
    current = None
    for line in raw.splitlines():
        if line and not line[0].isspace():
            parts = line.split(":")
            if len(parts) >= 2:
                name    = parts[1].strip().split("@")[0]
                current = {"name": name, "state": "DOWN", "addrs": []}
                ifaces.append(current)
                if "UP" in line:
                    current["state"] = "UP"
        elif current and "inet " in line:
            addr = line.strip().split()[1]
            current["addrs"].append(addr)
    return ifaces


def get_system_stats():
    return {
        "cpu":    cpu_percent(),
        "mem":    mem_info(),
        "disk":   disk_usage("/"),
        "uptime": uptime_str(),
        "load":   load_avg(),
        "net":    network_info(),
    }
