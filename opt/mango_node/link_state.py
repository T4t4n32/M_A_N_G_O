"""
Detección de transporte disponible para M.A.N.G.O. node.

Prioridad:
  1A. Wi-Fi   → HTTP directo a VPS
  1B. LTE     → HTTP directo a VPS (Huawei E3372H-153 aparece como usb0/eth1)
  2.  LoRa    → HTTP via gateway
  3.  Sin red → guardar local (spool)
"""

from __future__ import annotations

import re
import subprocess
import urllib.request
from typing import Optional

from .config import API_URL, WIFI_IFACES, LTE_IFACES, ENABLE_LORA, VERBOSE


def _health_url() -> str:
    if API_URL.endswith("/ingest"):
        return API_URL[:-len("ingest")] + "health"
    return API_URL.rstrip("/") + "/health"


def _run(cmd: list[str], timeout: int = 2) -> str:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except Exception:
        return ""


def _default_interface() -> Optional[str]:
    out = _run(["ip", "route", "show", "default"])
    for line in out.splitlines():
        m = re.search(r"\bdev\s+(\S+)", line)
        if m:
            return m.group(1)
    return None


def _interface_type(iface: str | None) -> str:
    """
    Determina si la interfaz es wifi, lte u otra.
    El Huawei E3372H-153 aparece típicamente como usb0, eth1, o wwan0.
    """
    if not iface:
        return "unknown"
    if iface in WIFI_IFACES:
        return "wifi"
    if iface in LTE_IFACES:
        return "lte"
    # Detección adicional por nombre
    if iface.startswith(("wlan", "ath")):
        return "wifi"
    if iface.startswith(("usb", "wwan", "eth", "ppp")):
        # Verificar si es modem vía NetworkManager
        nm = _run(["nmcli", "-t", "-f", "DEVICE,TYPE", "device"], timeout=3)
        for line in nm.splitlines():
            parts = line.split(":")
            if len(parts) >= 2 and parts[0] == iface:
                if parts[1] in ("gsm", "wwan", "usb"):
                    return "lte"
        return "lte"   # Asumir LTE para interfaces eth no conocidas
    return "http"


def _http_available() -> bool:
    try:
        with urllib.request.urlopen(_health_url(), timeout=5) as r:
            ok = 200 <= r.getcode() < 300
            if VERBOSE:
                print(f"[link] health → {r.getcode()}")
            return ok
    except Exception as e:
        if VERBOSE:
            print(f"[link] no HTTP: {e}")
        return False


def http_transport() -> Optional[str]:
    """Devuelve 'wifi', 'lte', 'http' o None."""
    if not _http_available():
        return None
    iface = _default_interface()
    t = _interface_type(iface)
    if VERBOSE:
        print(f"[link] transport={t} iface={iface}")
    return t


def lora_available() -> bool:
    if not ENABLE_LORA:
        return False
    # Comprobar si el módulo LoRa responde
    result = _run(["/usr/bin/python3", "/opt/mango_node/lora_ping.py"], timeout=3)
    return result.lower() in ("ok", "pong", "1", "true")


def best_transport() -> Optional[str]:
    """
    Devuelve el mejor transporte disponible.
    Nivel 1A/1B: Wi-Fi o LTE → 'wifi'/'lte'
    Nivel 2:     LoRa        → 'lora'
    Nivel 3:     Sin nada    → None (guardar local)
    """
    t = http_transport()
    if t:
        return t
    if lora_available():
        return "lora"
    return None