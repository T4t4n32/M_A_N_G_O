"""LoRa transport placeholder for M.A.N.G.O. node.

The Jetson TK1 does not include a LoRa transceiver by default.
This module returns a failure unless LoRa is explicitly enabled
and an external send command is configured.
"""

import subprocess

from .config import ENABLE_LORA, VERBOSE


def send_one(row):
    """Attempt to send a single measurement row via LoRa.

    Returns (ok, ids, error).
    """
    rid = row.get("id")
    if rid is None:
        return False, [], "missing id"
    if not ENABLE_LORA:
        return False, [int(rid)], "LoRa not enabled"
    cmd = []  # configure with external command if LoRa hardware is present
    if not cmd:
        return False, [int(rid)], "LoRa send command not configured"
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = proc.communicate()
        if proc.returncode == 0:
            if VERBOSE:
                print("[lora] sent row id={}".format(rid))
            return True, [int(rid)], ""
        else:
            err = stderr.strip() or stdout.strip() or "exit {}".format(proc.returncode)
            if isinstance(err, bytes):
                err = err.decode("utf-8", errors="replace")
            if VERBOSE:
                print("[lora] send failed id={} err={}".format(rid, err))
            return False, [int(rid)], err
    except Exception as e:
        if VERBOSE:
            print("[lora] exception: {}".format(e))
        return False, [int(rid)], str(e)
