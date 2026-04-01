"""HTTP transport for sending sensor measurements to the backend.

This module defines a single function, :func:`send_batch`, which takes a
list of unsent database rows, constructs the JSON payload expected by the
backend ingest route, and POSTs it using Python's standard library.  The
endpoint URL and station name come from :mod:`config`.  If an API key
is configured in ``config.INGEST_API_KEY`` it is added as an
``X-API-Key`` header.  On success all rows are returned as sent; on
failure the rows are returned along with the error so the caller can
record the failure and retry later.

The backend ingestion contract is defined in ``backend/app/routes.py`` of
the M.A.N.G.O. repository【99809737876439†L59-L117】.  It expects a payload of the form::

    {
        "station": {"name": "StationName"},
        "readings": [
            {"type": "ph", "value": 7.12, "unit": "", "label": ""},
            {"type": "temperature", "value": 24.36, "unit": "°C", "label": ""},
            {"type": "turbidity", "value": 183.4, "unit": "NTU", "label": ""}
        ]
    }

Only the ``type`` and ``value`` keys are strictly required; ``unit``
and ``label`` will be stored in the database but are optional.  The
Jetson does not provide its own timestamp; the backend assigns the
current UTC time on ingestion【99809737876439†L59-L117】.
"""

from __future__ import annotations

import json
from typing import Iterable, List, Tuple

import urllib.request
import urllib.error

from .config import API_URL, INGEST_API_KEY, STATION_NAME, VERBOSE


def _build_readings(row: dict) -> List[dict]:
    """Return a list of reading objects from a measurement row.

    Each measurement row may contain values for pH, turbidity and
    temperature.  For each non‑null value a reading dictionary is
    created with the appropriate sensor type and value.  Units are
    supplied based on the frontend's definitions【758136961370910†L2-L35】, but they are
    optional and may be omitted if empty.
    """
    readings: List[dict] = []
    # row keys: id, measured_at, ph, turbidity, temperature, alert_level
    ph = row.get("ph")
    if ph is not None:
        readings.append({"type": "ph", "value": ph, "unit": "", "label": ""})
    turb = row.get("turbidity")
    if turb is not None:
        readings.append({"type": "turbidity", "value": turb, "unit": "NTU", "label": ""})
    temp = row.get("temperature")
    if temp is not None:
        readings.append({"type": "temperature", "value": temp, "unit": "°C", "label": ""})
    return readings


def send_batch(rows: Iterable[dict]) -> Tuple[bool, List[int], str]:
    """Send a batch of measurement rows to the backend.

    Parameters
    ----------
    rows:
        An iterable of dicts representing unsent measurement rows.  Each
        dict must have at least the keys ``id``, ``ph``, ``turbidity`` and
        ``temperature``.  Rows with no sensor values will be skipped.

    Returns
    -------
    tuple
        A tuple ``(ok, ids, error)`` where ``ok`` is a boolean
        indicating whether the request succeeded (HTTP status 2xx),
        ``ids`` is a list of row IDs corresponding to the input rows, and
        ``error`` is an error string when ``ok`` is False.  When
        ``ok`` is True the error string is empty.
    """
    all_readings: List[dict] = []
    ids: List[int] = []
    for row in rows:
        # Convert sqlite3.Row or dict to plain dict
        try:
            row_dict = dict(row)
        except Exception:
            row_dict = row  # assume already a mapping
        rlist = _build_readings(row_dict)
        if not rlist:
            continue
        all_readings.extend(rlist)
        rid = row_dict.get("id")
        if rid is not None:
            ids.append(int(rid))
    # If there are no readings to send, treat this as success
    if not all_readings:
        return True, ids, ""
    payload = {
        "station": {"name": STATION_NAME},
        "readings": all_readings,
    }
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if INGEST_API_KEY:
        headers["X-API-Key"] = INGEST_API_KEY
    req = urllib.request.Request(API_URL, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.getcode()
            if VERBOSE:
                print(f"[http] POST {API_URL} status={status} inserted={len(all_readings)}")
            # Consider 2xx codes as success
            if 200 <= status < 300:
                return True, ids, ""
            # Non‑2xx status counts as failure
            return False, ids, f"unexpected status code: {status}"
    except urllib.error.HTTPError as e:
        # HTTP error (non‑2xx)
        err = f"HTTPError {e.code}: {e.reason}"
        if VERBOSE:
            print(f"[http] error: {err}")
        return False, ids, err
    except urllib.error.URLError as e:
        # Network failure
        err = str(e.reason)
        if VERBOSE:
            print(f"[http] url error: {err}")
        return False, ids, err
    except Exception as e:
        err = str(e)
        if VERBOSE:
            print(f"[http] unknown error: {err}")
        return False, ids, err