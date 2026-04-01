"""Network and transport selection utilities for M.A.N.G.O. node.

This module provides functions to determine which transport should
be used to upload data.  The priorities are:

1. **HTTP over Wi‑Fi or LTE**.  If the backend health endpoint is
   reachable the function returns ``"wifi"`` or ``"lte"`` depending on
   which network interface is currently the default route.  If the
   default interface is unknown it returns ``"http"``.
2. **LoRa** (optional).  If HTTP is unavailable and LoRa is enabled
   in the configuration, it returns ``"lora"``.  A simple check
   function can be extended to test LoRa connectivity.  By default
   LoRa is considered unavailable unless ``ENABLE_LORA`` is true and
   a ping command succeeds.
3. **None** if no transport is available.  The caller should then
   buffer data locally and retry later.

The implementation uses standard system commands to query network
state.  ``ip route show default`` is used to identify the default
interface, and ``urllib.request`` is used to test connectivity to
the backend ``/health`` endpoint【99809737876439†L59-L117】.
"""

from __future__ import annotations

import os
import re
import subprocess
import urllib.request
from typing import Optional

from .config import (
    API_URL,
    WIFI_IFACES,
    LTE_IFACES,
    ENABLE_LORA,
    VERBOSE,
)


def _health_url() -> str:
    """Return the health check URL derived from API_URL.

    The backend groups API routes under ``/api/v1`` and the health
    endpoint lives at ``/health``【99809737876439†L20-L56】.  If the ingest URL ends with
    ``/ingest``, replace that suffix with ``/health``; otherwise append
    ``/health``.
    """
    if API_URL.endswith("/ingest"):
        return API_URL[: -len("ingest")] + "health"
    return API_URL.rstrip("/") + "/health"


def _default_interface() -> Optional[str]:
    """Return the name of the default network interface or ``None``.

    Parses the output of ``ip route show default`` which typically
    contains a line like ``default via 192.168.1.1 dev wlan0 ...``.  If
    parsing fails or no default route is set, returns None.
    """
    try:
        proc = subprocess.run(
            ["ip", "route", "show", "default"], capture_output=True, text=True, timeout=2
        )
    except Exception:
        return None
    output = proc.stdout.strip().splitlines()
    for line in output:
        # Look for 'dev <iface>' in the line
        m = re.search(r"\bdev\s+(\S+)", line)
        if m:
            return m.group(1)
    return None


def _http_available() -> bool:
    """Return True if the backend health endpoint can be reached."""
    url = _health_url()
    try:
        with urllib.request.urlopen(url, timeout=3) as resp:
            code = resp.getcode()
            if VERBOSE:
                print(f"[link] health {url} status={code}")
            return 200 <= code < 300
    except Exception as e:
        if VERBOSE:
            print(f"[link] health check failed: {e}")
        return False


def http_transport() -> Optional[str]:
    """Return the available HTTP transport type or None.

    If the backend is reachable, this function determines whether the
    default interface belongs to the Wi‑Fi or LTE list.  Returns
    ``"wifi"``, ``"lte"`` or ``"http"`` (generic) accordingly.  If
    connectivity fails returns None.
    """
    if not _http_available():
        return None
    iface = _default_interface()
    if iface:
        if iface in WIFI_IFACES:
            return "wifi"
        if iface in LTE_IFACES:
            return "lte"
        # Unknown interface but HTTP reachable
        return "http"
    # No default route but HTTP reachable (unlikely)
    return "http"


def _lora_available() -> bool:
    """Return True if LoRa transport is available.

    This placeholder implementation returns True only when
    ``ENABLE_LORA`` is set.  In a real deployment you may wish to
    execute a command to ping the LoRa gateway or check the status of
    the transceiver.  For example:

    .. code-block:: python

        return subprocess.run(["/usr/bin/lora_ping"], timeout=2).returncode == 0
    """
    return ENABLE_LORA


def best_transport() -> Optional[str]:
    """Return the best available transport.

    Returns one of ``"wifi"``, ``"lte"``, ``"http"`` (generic HTTP),
    ``"lora"`` or ``None``.  HTTP transports are preferred over LoRa.
    """
    t = http_transport()
    if t:
        return t
    # If no HTTP path and LoRa is enabled, fall back
    if _lora_available():
        return "lora"
    return None