"""HTTP transport — sends sensor measurements to the VPS backend.

Primary endpoint: POST /api/v1/ingest/batch
Fallback:         POST /api/v1/ingest  (single packet, backward-compat)
"""

import json
import urllib.error
import urllib.request
from datetime import datetime, timezone

from .config import API_URL, INGEST_API_KEY, STATION_NAME, VERBOSE

_BATCH_URL = API_URL.rstrip("/").replace("/ingest", "/ingest/batch")
if not _BATCH_URL.endswith("/ingest/batch"):
    _BATCH_URL = API_URL.rstrip("/").rsplit("/ingest", 1)[0] + "/ingest/batch"


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def _build_readings(row):
    readings = []
    ph = row.get("ph")
    if ph is not None:
        readings.append({"type": "ph", "value": ph, "unit": ""})
    turb = row.get("turbidity")
    if turb is not None:
        readings.append({"type": "turbidity", "value": turb, "unit": "NTU"})
    temp = row.get("temperature")
    if temp is not None:
        readings.append({"type": "temperature", "value": temp, "unit": "°C"})
    return readings


def _build_packet(row):
    readings = _build_readings(row)
    if not readings:
        return None

    device_id = row.get("device_id") or STATION_NAME
    seq = row.get("seq")
    packet_id = row.get("packet_id")

    if not packet_id:
        if seq is not None:
            packet_id = "{}-{:08d}".format(device_id, int(seq))
        else:
            rid = row.get("id")
            if rid is not None:
                packet_id = "{}-row{:08d}".format(device_id, int(rid))

    return {
        "station":           {"name": STATION_NAME},
        "device_id":         device_id,
        "packet_id":         packet_id,
        "seq":               seq,
        "created_at_device": row.get("measured_at"),
        "created_at_edge":   _utc_now_iso(),
        "readings":          readings,
    }


def _post(url, data, headers):
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.getcode()
            if 200 <= status < 300:
                return True, ""
            return False, "HTTP {}".format(status)
    except urllib.error.HTTPError as e:
        return False, "HTTPError {}: {}".format(e.code, e.reason)
    except urllib.error.URLError as e:
        return False, str(e.reason)
    except Exception as e:
        return False, str(e)


def send_batch(rows):
    """Send a batch of measurement rows to the backend via /ingest/batch.

    Falls back to /ingest (single packet) if batch endpoint fails.
    Returns (ok, ids, error).
    """
    packets = []
    ids = []

    for row in rows:
        try:
            row_dict = dict(row)
        except Exception:
            row_dict = row
        pkt = _build_packet(row_dict)
        if pkt is None:
            continue
        packets.append(pkt)
        rid = row_dict.get("id")
        if rid is not None:
            ids.append(int(rid))

    if not packets:
        return True, ids, ""

    headers = {"Content-Type": "application/json"}
    if INGEST_API_KEY:
        headers["X-Api-Key"] = INGEST_API_KEY

    batch_payload = json.dumps({"packets": packets}).encode("utf-8")
    ok, err = _post(_BATCH_URL, batch_payload, headers)

    if ok:
        if VERBOSE:
            print("[http] batch POST {} packets={}".format(_BATCH_URL, len(packets)))
        return True, ids, ""

    if VERBOSE:
        print("[http] batch failed ({}), falling back to single /ingest".format(err))

    failed_ids = []
    for pkt, rid in zip(packets, ids):
        single_payload = json.dumps(pkt).encode("utf-8")
        pkt_ok, pkt_err = _post(API_URL, single_payload, headers)
        if not pkt_ok:
            failed_ids.append(rid)
            if VERBOSE:
                print("[http] single POST failed id={}: {}".format(rid, pkt_err))

    if failed_ids:
        return False, ids, "batch failed ({}); {}/{} single posts also failed".format(
            err, len(failed_ids), len(ids))

    if VERBOSE:
        print("[http] fallback single POST: all {} packets sent".format(len(ids)))
    return True, ids, ""
