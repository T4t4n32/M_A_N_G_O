"""LoRa transport for sending sensor measurements to the gateway.

This module defines a function ``send_one`` which attempts to send a
single measurement via LoRa.  The Jetson TK1 does not include a LoRa
transceiver by default; enabling LoRa requires additional hardware and
custom scripts to interface with the RA‑02 module.  Therefore this
implementation is a placeholder: it simply returns a failure unless
LoRa is explicitly enabled in the configuration and a custom command
is provided.

To enable real LoRa sending, set ``ENABLE_LORA=True`` in
``mango_node.config`` and implement the external command to send
packets.  For example, you could write a Python script that opens a
serial port to the RA‑02 module and writes a compact payload such as
``TEMP=24.36;PH=7.12;TURB=183.4``【136288353562†L70-L78】.  The command should return a
zero exit status on success.
"""

from __future__ import annotations

import json
import subprocess
from typing import Iterable, List, Tuple

from .config import ENABLE_LORA, VERBOSE


def send_one(row: dict) -> Tuple[bool, List[int], str]:
    """Attempt to send a single measurement row via LoRa.

    Parameters
    ----------
    row:
        A mapping representing one measurement.  Must contain keys
        ``id``, ``ph``, ``turbidity`` and ``temperature``.

    Returns
    -------
    tuple
        A tuple ``(ok, ids, error)`` where ``ok`` is True on
        success, ``ids`` is a list containing the row's ID, and
        ``error`` contains an explanation on failure.
    """
    rid = row.get("id")
    if rid is None:
        return False, [], "missing id"
    # If LoRa is not enabled just return a failure immediately.
    if not ENABLE_LORA:
        return False, [int(rid)], "LoRa not enabled"
    # Placeholder: attempt to run an external command to send the data.
    # You can customise this command via environment variables or
    # configuration if you wish to integrate with your hardware.
    cmd = []  # e.g. ["/usr/bin/lora_send", json.dumps({...})]
    if not cmd:
        return False, [int(rid)], "LoRa send command not configured"
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if proc.returncode == 0:
            if VERBOSE:
                print(f"[lora] sent row id={rid}")
            return True, [int(rid)], ""
        else:
            err = proc.stderr.strip() or proc.stdout.strip() or f"exit {proc.returncode}"
            if VERBOSE:
                print(f"[lora] send failed id={rid} err={err}")
            return False, [int(rid)], err
    except Exception as e:
        if VERBOSE:
            print(f"[lora] exception: {e}")
        return False, [int(rid)], str(e)