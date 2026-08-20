"""Logging configuration for the Flask app.

Without an explicit configuration the `mango.*` loggers used across the
codebase propagate to a root logger that has no handler, so anything below
WARNING is discarded and tracebacks never reach the container logs. This
module wires those loggers to stderr (captured by gunicorn/Docker) so that
handled errors are observable instead of silent.
"""

from __future__ import annotations

import logging
import os
import sys

_CONFIGURED = False

_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"


def configure_logging() -> None:
    """Attach a stderr handler to the `mango` logger hierarchy (idempotent)."""

    global _CONFIGURED
    if _CONFIGURED:
        return

    level_name = os.getenv("LOG_LEVEL", "INFO").strip().upper()
    level = getattr(logging, level_name, logging.INFO)
    if not isinstance(level, int):
        level = logging.INFO

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(_FORMAT))

    mango_log = logging.getLogger("mango")
    mango_log.setLevel(level)
    mango_log.propagate = False
    for existing in list(mango_log.handlers):
        mango_log.removeHandler(existing)
    mango_log.addHandler(handler)

    root = logging.getLogger()
    if not root.handlers:
        root.setLevel(logging.WARNING)
        root.addHandler(handler)

    _CONFIGURED = True
