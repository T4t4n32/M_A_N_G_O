"""
GET /api/v1/stream — Server-Sent Events for real-time sensor data.

Publishes whenever compat_ingest writes a new reading to Redis channel
"mango:readings". Falls back to heartbeat-only when Redis is unavailable
so the client can detect the connection is alive and retry.

Gunicorn runs --worker-class gthread (2 workers × 4 threads = 8 max
concurrent connections). Each SSE client holds one thread for the
duration of the connection.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Generator

from flask import Blueprint, Response, stream_with_context

from app.extensions import redis_client

log = logging.getLogger("mango.stream")

stream_bp = Blueprint("stream", __name__, url_prefix="/api/v1")

CHANNEL = "mango:readings"
KEEPALIVE_INTERVAL = 25   # seconds — below most proxy idle-connection timeouts
POLL_SLEEP = 0.05         # 50 ms Redis poll cadence


def _frame(data: str, event: str = "message") -> str:
    return f"event: {event}\ndata: {data}\n\n"


def _sse_generator() -> Generator[str, None, None]:
    if redis_client is None:
        log.warning("SSE: Redis unavailable — heartbeat-only mode")
        while True:
            try:
                yield _frame(json.dumps({"type": "heartbeat"}), event="heartbeat")
                time.sleep(KEEPALIVE_INTERVAL)
            except GeneratorExit:
                return

    pubsub = redis_client.pubsub(ignore_subscribe_messages=True)
    try:
        pubsub.subscribe(CHANNEL)
        last_hb = time.monotonic()

        while True:
            msg = pubsub.get_message()
            if msg and msg["type"] == "message":
                try:
                    payload = json.loads(msg["data"])
                except (TypeError, ValueError):
                    log.warning("SSE: dropping malformed message on %s: %r", CHANNEL, msg["data"])
                else:
                    yield _frame(json.dumps(payload))

            now = time.monotonic()
            if now - last_hb >= KEEPALIVE_INTERVAL:
                yield _frame(json.dumps({"type": "heartbeat"}), event="heartbeat")
                last_hb = now

            time.sleep(POLL_SLEEP)

    except GeneratorExit:
        pass
    except Exception:
        log.exception("SSE: stream aborted")
        raise
    finally:
        try:
            pubsub.unsubscribe(CHANNEL)
            pubsub.close()
        except Exception:
            log.warning("SSE: pubsub cleanup failed", exc_info=True)


@stream_bp.get("/stream")
def sensor_stream():
    headers = {
        "Content-Type":    "text/event-stream",
        "Cache-Control":   "no-cache",
        "Connection":      "keep-alive",
        "X-Accel-Buffering": "no",   # prevents Nginx from buffering the SSE stream
    }
    return Response(
        stream_with_context(_sse_generator()),
        headers=headers,
    )
