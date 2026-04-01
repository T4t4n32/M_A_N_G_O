# -*- coding: utf-8 -*-
import time
from db import init_db, list_pending, mark_sent, mark_failed
from link_state import best_transport
from transport_http import send_http
from transport_lora import send_lora
from config import HTTP_BATCH_SIZE, SYNC_INTERVAL_SEC

def main():
    init_db()

    while True:
        transport = best_transport()
        if not transport:
            print("no link available")
            time.sleep(SYNC_INTERVAL_SEC)
            continue

        if transport in ("wifi", "lte", "http"):
            rows = list_pending(HTTP_BATCH_SIZE, critical_only=False)
            if not rows:
                time.sleep(SYNC_INTERVAL_SEC)
                continue

            ok, local_ids, err = send_http(rows)
            if ok:
                mark_sent(local_ids, transport)
                print("sent {} rows via {}".format(len(local_ids), transport))
            else:
                mark_failed(local_ids, err)
                print("http failed:", err)

        elif transport == "lora":
            rows = list_pending(1, critical_only=True)
            if not rows:
                rows = list_pending(1, critical_only=False)

            if not rows:
                time.sleep(SYNC_INTERVAL_SEC)
                continue

            ok, local_ids, err = send_lora(rows)
            if ok:
                mark_sent(local_ids, "lora")
                print("sent 1 row via lora")
            else:
                mark_failed(local_ids, err)
                print("lora failed:", err)

        time.sleep(SYNC_INTERVAL_SEC)

if __name__ == "__main__":
    main()