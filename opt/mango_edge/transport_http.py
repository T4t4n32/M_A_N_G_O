# -*- coding: utf-8 -*-
import json
import urllib.request
from config import INGEST_URL, DEVICE_ID, HTTP_TIMEOUT_SEC

def send_http(rows):
    records = []
    local_ids = []

    for row in rows:
        item = dict(row["payload"])
        item["device_id"] = row["device_id"]
        item["seq"] = row["seq"]
        item["measured_at"] = row["measured_at"]
        item["alert_level"] = row["alert_level"]
        records.append(item)
        local_ids.append(row["local_id"])

    body = json.dumps({
        "device_id": DEVICE_ID,
        "records": records
    }).encode("utf-8")

    req = urllib.request.Request(
        INGEST_URL,
        data=body,
        headers={"Content-Type": "application/json"}
    )

    try:
        r = urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SEC)
        ok = 200 <= r.getcode() < 300
        return ok, local_ids, ""
    except Exception as e:
        return False, local_ids, str(e)