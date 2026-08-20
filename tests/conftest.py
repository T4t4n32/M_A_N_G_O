"""Shared pytest configuration for the M.A.N.G.O test suite.

The suite is executed both from the repository root and from `backend/`
(CI runs `pytest ../tests/`), so import paths are resolved explicitly here.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND = REPO_ROOT / "backend"
BRIDGE = REPO_ROOT / "bridge"

for path in (REPO_ROOT, BACKEND, BRIDGE):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

# Deterministic defaults for modules that read configuration at import time.
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
