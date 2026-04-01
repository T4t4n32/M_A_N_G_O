"""Synchronise unsent measurements to the backend or via LoRa.

This module runs as a long‑lived process that periodically checks
the local SQLite outbox for measurements which have not yet been
uploaded.  It decides which transport to use by consulting
``link_state.best_transport`` and attempts to send batches over
HTTP or single rows via LoRa.  After a successful send the rows
are marked as sent; on failure the retry count and error are
recorded.  The sleep interval between iterations is governed by
``config.SYNC_INTERVAL``.

Usage::

    python3 -m mango_node.sync_manager

The process can be managed by systemd to ensure it restarts
automatically on crash and starts at boot.
"""

from __future__ import annotations

import time
from typing import Iterable, List

from .config import SYNC_INTERVAL, HTTP_BATCH_SIZE, VERBOSE
from .db import init_db, fetch_unsent, mark_sent, mark_failed
from .link_state import best_transport
from .transport_http import send_batch
from .transport_lora import send_one


def _send_http_batch() -> None:
    """Fetch unsent rows and attempt to send them via HTTP."""
    rows = fetch_unsent(HTTP_BATCH_SIZE)
    if not rows:
        return
    ok, ids, err = send_batch(rows)
    if ok:
        mark_sent(ids)
        if VERBOSE:
            print(f"[sync] HTTP: sent {len(ids)} rows")
    else:
        mark_failed(ids, err)
        if VERBOSE:
            print(f"[sync] HTTP error: {err}")


def _send_lora_one() -> None:
    """Fetch the oldest unsent row and attempt to send it via LoRa."""
    rows = fetch_unsent(1)
    if not rows:
        return
    row = dict(rows[0])
    ok, ids, err = send_one(row)
    if ok:
        mark_sent(ids)
    else:
        mark_failed(ids, err)
    if VERBOSE:
        if ok:
            print("[sync] LoRa: sent one row")
        else:
            print(f"[sync] LoRa error: {err}")


def main() -> None:
    """Entry point for the synchronisation service."""
    init_db()
    if VERBOSE:
        print("[sync] started")
    while True:
        # Determine the best available transport
        t = best_transport()
        if t in ("wifi", "lte", "http"):
            _send_http_batch()
        elif t == "lora":
            _send_lora_one()
        else:
            # No transport available; nothing to do
            if VERBOSE:
                print("[sync] no transport available, buffering")
        time.sleep(SYNC_INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("[sync] terminated by user")