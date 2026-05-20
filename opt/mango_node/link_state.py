"""Deteccion de transporte disponible para M.A.N.G.O. node.

Prioridad:
  1A. Wi-Fi   -> HTTP directo a VPS
  1B. LTE     -> HTTP directo a VPS (Huawei E3372H-153 aparece como usb0/eth1)
  2.  LoRa    -> HTTP via gateway
  3.  Sin red -> guardar local (spool)
"""

import re
import subprocess
import urllib.request

from .config import API_URL, WIFI_IFACES, LTE_IFACES, ENABLE_LORA, VERBOSE


def _health_url():
    if API_URL.endswith("/ingest"):
        return API_URL[:-len("ingest")] + "health"
    return API_URL.rstrip("/") + "/health"


def _run(cmd, timeout=2):
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, _ = proc.communicate()
        return stdout.decode("utf-8", errors="replace").strip()
    except Exception:
        return ""


def _default_interface():
    out = _run(["ip", "route", "show", "default"])
    for line in out.splitlines():
        m = re.search(r"\bdev\s+(\S+)", line)
        if m:
            return m.group(1)
    return None


def _interface_type(iface):
    """Determina si la interfaz es wifi, lte u otra."""
    if not iface:
        return "unknown"
    if iface in WIFI_IFACES:
        return "wifi"
    if iface in LTE_IFACES:
        return "lte"
    if iface.startswith(("wlan", "ath")):
        return "wifi"
    if iface.startswith(("usb", "wwan", "eth", "ppp")):
        nm = _run(["nmcli", "-t", "-f", "DEVICE,TYPE", "device"])
        for line in nm.splitlines():
            parts = line.split(":")
            if len(parts) >= 2 and parts[0] == iface:
                if parts[1] in ("gsm", "wwan", "usb"):
                    return "lte"
        return "lte"
    return "http"


def _http_available():
    try:
        with urllib.request.urlopen(_health_url(), timeout=5) as r:
            ok = 200 <= r.getcode() < 300
            if VERBOSE:
                print("[link] health -> {}".format(r.getcode()))
            return ok
    except Exception as e:
        if VERBOSE:
            print("[link] no HTTP: {}".format(e))
        return False


def http_transport():
    """Devuelve 'wifi', 'lte', 'http' o None."""
    if not _http_available():
        return None
    iface = _default_interface()
    t = _interface_type(iface)
    if VERBOSE:
        print("[link] transport={} iface={}".format(t, iface))
    return t


def lora_available():
    if not ENABLE_LORA:
        return False
    result = _run(["/usr/bin/python3", "/opt/mango_node/lora_ping.py"])
    return result.lower() in ("ok", "pong", "1", "true")


def best_transport():
    """Devuelve el mejor transporte disponible o None."""
    t = http_transport()
    if t:
        return t
    if lora_available():
        return "lora"
    return None
