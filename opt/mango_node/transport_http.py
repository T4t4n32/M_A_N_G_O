"""HTTP transport — sends sensor measurements to the VPS backend.

Primary endpoint: POST /api/v1/ingest/batch
Fallback:         POST /api/v1/ingest  (single packet, backward-compat)

Each row is wrapped in the standard packet format:
  {
    "station":           {"name": "<STATION_NAME>"},
    "device_id":         "<DEVICE_ID>",
    "packet_id":         "<device_id>-<seq:08d>",
    "seq":               <int or null>,
    "created_at_device": "<ISO timestamp or null>",
    "created_at_edge":   "<ISO timestamp>",
    "readings":          [...]
  }

The packet_id allows the backend to deduplicate packets that are
replayed by the store-and-forward mechanism.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Iterable, List, Tuple

from .config import API_URL, INGEST_API_KEY, STATION_NAME, VERBOSE

_BATCH_URL = API_URL.rstrip("/").replace("/ingest", "/ingest/batch")
if not _BATCH_URL.endswith("/ingest/batch"):
    _BATCH_URL = API_URL.rstrip("/").rsplit("/ingest", 1)[0] + "/ingest/batch"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_readings(row: dict) -> List[dict]:
    readings: List[dict] = []
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


def _build_packet(row: dict) -> dict | None:
    readings = _build_readings(row)
    if not readings:
        return None

    device_id = row.get("device_id") or STATION_NAME
    seq = row.get("seq")
    packet_id = row.get("packet_id")

    # Generate packet_id from device_id + seq if not already set
    if not packet_id:
        if seq is not None:
            packet_id = f"{device_id}-{int(seq):08d}"
        else:
            # Use row id as fallback sequence
            rid = row.get("id")
            if rid is not None:
                packet_id = f"{device_id}-row{int(rid):08d}"

    return {
        "station":           {"name": STATION_NAME},
        "device_id":         device_id,
        "packet_id":         packet_id,
        "seq":               seq,
        "created_at_device": row.get("measured_at"),
        "created_at_edge":   _utc_now_iso(),
        "readings":          readings,
    }


def _post(url: str, data: bytes, headers: dict) -> Tuple[bool, str]:
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.getcode()
            if 200 <= status < 300:
                return True, ""
            return False, f"HTTP {status}"
    except urllib.error.HTTPError as e:
        return False, f"HTTPError {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return False, str(e.reason)
    except Exception as e:
        return False, str(e)


def send_batch(rows: Iterable[dict]) -> Tuple[bool, List[int], str]:
    """Send a batch of measurement rows to the backend via /ingest/batch.

    Falls back to /ingest (single packet) if batch endpoint fails.

    Returns (ok, ids, error).
    """
    packets = []
    ids: List[int] = []

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

    # Try batch endpoint first
    batch_payload = json.dumps({"packets": packets}).encode("utf-8")
    ok, err = _post(_BATCH_URL, batch_payload, headers)

    if ok:
        if VERBOSE:
            print(f"[http] batch POST {_BATCH_URL} packets={len(packets)}")
        return True, ids, ""

    if VERBOSE:
        print(f"[http] batch failed ({err}), falling back to single /ingest")

    # Fallback: send each packet individually to /ingest
    failed_ids = []
    for pkt, rid in zip(packets, ids):
        single_payload = json.dumps(pkt).encode("utf-8")
        pkt_ok, pkt_err = _post(API_URL, single_payload, headers)
        if not pkt_ok:
            failed_ids.append(rid)
            if VERBOSE:
                print(f"[http] single POST failed id={rid}: {pkt_err}")

    if failed_ids:
        return False, ids, f"batch failed ({err}); {len(failed_ids)}/{len(ids)} single posts also failed"

    if VERBOSE:
        print(f"[http] fallback single POST: all {len(ids)} packets sent")
    return True, ids, ""
