# -*- coding: utf-8 -*-
import json
import subprocess
from config import LORA_SEND_CMD, DEVICE_ID

def send_lora(rows):
    # LoRa: drena lento. Enviamos solo 1 registro por intento.
    row = rows[0]

    packet = {
        "device_id": DEVICE_ID,
        "seq": row["seq"],
        "measured_at": row["measured_at"],
        "alert_level": row["alert_level"],
        "payload": row["payload"]
    }

    try:
        p = subprocess.Popen(
            LORA_SEND_CMD,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        out, err = p.communicate(json.dumps(packet).encode("utf-8"))
        ok = (p.returncode == 0)
        if ok:
            return True, [row["local_id"]], ""
        return False, [row["local_id"]], err.decode("utf-8", "ignore")
    except Exception as e:
        return False, [row["local_id"]], str(e)