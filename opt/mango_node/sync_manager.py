"""Synchronise unsent measurements to the backend or via LoRa.

Runs as a long-lived process that periodically checks the local SQLite
outbox and attempts to send batches to the VPS backend.
"""

import sys
import time

from .config import SYNC_INTERVAL, HTTP_BATCH_SIZE, VERBOSE
from .db import init_db, fetch_unsent, mark_sent, mark_failed
from .link_state import best_transport
from .transport_http import send_batch
from .transport_lora import send_one


def _send_http_batch():
    rows = fetch_unsent(HTTP_BATCH_SIZE)
    if not rows:
        return
    ok, ids, err = send_batch(rows)
    if ok:
        mark_sent(ids)
        if VERBOSE:
            print("[sync] HTTP: sent {} rows".format(len(ids)))
    else:
        mark_failed(ids, err)
        if VERBOSE:
            print("[sync] HTTP error: {}".format(err))


def _send_lora_one():
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
            print("[sync] LoRa error: {}".format(err))


def main():
    init_db()
    if VERBOSE:
        print("[sync] started")
    while True:
        t = best_transport()
        if t in ("wifi", "lte", "http"):
            _send_http_batch()
        elif t == "lora":
            _send_lora_one()
        else:
            if VERBOSE:
                print("[sync] no transport available, buffering")
        time.sleep(SYNC_INTERVAL)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("[sync] terminated by user")
        sys.exit(0)
