# -*- coding: utf-8 -*-
import subprocess
import urllib.request
from config import HEALTH_URL, HTTP_TIMEOUT_SEC, WIFI_IFACES, LTE_IFACES, LORA_PING_CMD

def run_cmd(cmd):
    try:
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, _ = p.communicate()
        if p.returncode != 0:
            return ""
        return out.decode("utf-8", "ignore").strip()
    except Exception:
        return ""

def default_iface():
    out = run_cmd(["/bin/sh", "-c", "ip route show default 2>/dev/null | awk '/default/ {print $5; exit}'"])
    return out.strip()

def api_reachable():
    try:
        req = urllib.request.Request(HEALTH_URL)
        r = urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SEC)
        return 200 <= r.getcode() < 300
    except Exception:
        return False

def http_transport():
    if not api_reachable():
        return None

    iface = default_iface()
    if not iface:
        return None

    if iface in WIFI_IFACES:
        return "wifi"
    if iface in LTE_IFACES:
        return "lte"

    nm = run_cmd(["nmcli", "-t", "-f", "DEVICE,TYPE,STATE", "device", "status"])
    for line in nm.splitlines():
        parts = line.split(":")
        if len(parts) >= 3 and parts[0] == iface:
            dev_type = parts[1]
            if dev_type == "wifi":
                return "wifi"
            if dev_type in ("gsm", "wwan"):
                return "lte"

    return "http"

def lora_available():
    try:
        p = subprocess.Popen(LORA_PING_CMD, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        p.communicate()
        return p.returncode == 0
    except Exception:
        return False

def best_transport():
    transport = http_transport()
    if transport:
        return transport
    if lora_available():
        return "lora"
    return None