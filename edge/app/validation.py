"""Validation helpers shared by edge API routes."""

from __future__ import annotations

import re


_MISSION_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")


def validate_mission_id(value: object) -> str | None:
    """Return a safe mission identifier or None for invalid input."""
    if not isinstance(value, str):
        return None
    mission_id = value.strip()
    return mission_id if _MISSION_ID_RE.fullmatch(mission_id) else None
