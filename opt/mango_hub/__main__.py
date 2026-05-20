"""Entry point: python3 -m mango_hub"""

import os
import sys

# Load the shared .env before anything else so config reads correct values.
_env_path = os.path.join(os.path.dirname(__file__), "..", "mango_node", ".env")
_env_path = os.path.normpath(_env_path)
if not os.path.exists(_env_path):
    _env_path = "/opt/mango_node/.env"

if os.path.exists(_env_path):
    try:
        with open(_env_path) as _f:
            for _line in _f:
                _line = _line.strip()
                if not _line or _line.startswith("#") or "=" not in _line:
                    continue
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())
    except (IOError, OSError):
        pass  # no read permission — hub runs with env defaults

from .tui import run_tui

run_tui()
