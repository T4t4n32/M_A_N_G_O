#!/usr/bin/env python3
"""M.A.N.G.O. mission state machine.

Manages the mission lifecycle on the edge node:
  BOOT → SELF_CHECK → IDLE → ARMED → FIELD_RUNNING → PAUSED
       ↓                ↓                              ↓
     ERROR          RETURNING              MISSION_FINISHED → SYNCING → STANDBY

Posts state changes to the local edge API (POST /state) and polls
local SQLite for commands received from the VPS.

Physical button (GPIO — optional, falls back to software-only):
  - 3s hold on IDLE   → ARM
  - Short press       → mark field event
  - Long press (3s)   → STOP mission

Environment:
  DB_PATH         /opt/mango/edge.db
  MISSION_DIR     /opt/mango/missions
  DEVICE_ID       mango-field-unit-01
  EDGE_API_URL    http://localhost:9100
  BUTTON_GPIO     (optional) BCM pin number for physical button
  SM_POLL_S       poll interval in seconds (default 2)
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

log = logging.getLogger("mango.mission_sm")
logging.basicConfig(
    level=logging.DEBUG if os.environ.get("MANGO_VERBOSE") else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

DB_PATH      = os.environ.get("DB_PATH",      "/opt/mango/edge.db")
MISSION_DIR  = os.environ.get("MISSION_DIR",  "/opt/mango/missions")
DEVICE_ID    = os.environ.get("DEVICE_ID",    "mango-field-unit-01")
EDGE_API_URL = os.environ.get("EDGE_API_URL", "http://localhost:9100")
POLL_S       = float(os.environ.get("SM_POLL_S", "2"))
BUTTON_GPIO  = os.environ.get("BUTTON_GPIO")  # BCM pin, optional

# Valid state transitions
TRANSITIONS: dict[str, list[str]] = {
    "BOOT":             ["SELF_CHECK", "ERROR"],
    "SELF_CHECK":       ["IDLE",       "ERROR"],
    "IDLE":             ["ARMED",      "ERROR"],
    "ARMED":            ["FIELD_RUNNING", "IDLE", "ERROR"],
    "FIELD_RUNNING":    ["PAUSED", "RETURNING", "MISSION_FINISHED", "ERROR"],
    "PAUSED":           ["FIELD_RUNNING", "RETURNING", "MISSION_FINISHED", "ERROR"],
    "RETURNING":        ["MISSION_FINISHED", "ERROR"],
    "ERROR":            ["IDLE", "SELF_CHECK"],
    "MISSION_FINISHED": ["SYNCING"],
    "SYNCING":          ["STANDBY"],
    "STANDBY":          ["IDLE", "BOOT"],
}

COMMAND_MAP: dict[str, str] = {
    "ARM":        "ARMED",
    "START_FIELD": "FIELD_RUNNING",
    "START_TEST":  "FIELD_RUNNING",
    "PAUSE":       "PAUSED",
    "RESUME":      "FIELD_RUNNING",
    "STOP":        "MISSION_FINISHED",
    "SYNC_DATA":   "SYNCING",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _make_mission_id() -> str:
    return f"MANGO-{datetime.now(timezone.utc).strftime('%Y-%m-%d-%H%M%S')}"


# ── API helpers ───────────────────────────────────────────────────────────────

def _post_state(mission_id: str, state: str) -> bool:
    payload = {
        "mission_id": mission_id,
        "state":      state,
        "device_id":  DEVICE_ID,
        "source":     "state_machine",
    }
    body = json.dumps(payload).encode()
    req  = urllib.request.Request(
        f"{EDGE_API_URL}/state",
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception as e:
        log.warning("POST /state failed: %s", e)
        return False


def _poll_commands() -> list[dict]:
    """Return pending commands from local SQLite."""
    try:
        import sqlite3
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT * FROM commands WHERE status='pending' ORDER BY received_at"
            ).fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        log.warning("DB command poll failed: %s", e)
        return []


def _mark_command_done(cmd_id: int) -> None:
    try:
        import sqlite3
        now = _now_iso()
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "UPDATE commands SET status='executed', executed_at=? WHERE id=?",
                (now, cmd_id),
            )
    except Exception as e:
        log.warning("mark_command_done failed: %s", e)


def _self_check() -> bool:
    """Basic self-check: verify DB is writable and edge API is up."""
    try:
        import sqlite3
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("SELECT 1")
    except Exception as e:
        log.error("Self-check DB failed: %s", e)
        return False

    try:
        req = urllib.request.Request(f"{EDGE_API_URL}/health", method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status != 200:
                log.error("Self-check API failed: HTTP %d", resp.status)
                return False
    except Exception as e:
        log.error("Self-check API failed: %s", e)
        return False

    log.info("Self-check passed")
    return True


# ── Optional GPIO button ──────────────────────────────────────────────────────

def _setup_gpio() -> object | None:
    if not BUTTON_GPIO:
        return None
    try:
        import RPi.GPIO as GPIO  # type: ignore
        pin = int(BUTTON_GPIO)
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        log.info("GPIO button on pin %d", pin)
        return GPIO
    except Exception as e:
        log.warning("GPIO not available (%s) — button disabled", e)
        return None


def _read_button(gpio, pin: int) -> bool:
    """Returns True if button is pressed (active-low)."""
    try:
        return not gpio.input(pin)
    except Exception:
        return False


# ── State machine ─────────────────────────────────────────────────────────────

class MissionSM:
    def __init__(self) -> None:
        self.state       = "BOOT"
        self.mission_id  = _make_mission_id()
        self.gpio        = _setup_gpio()
        self.gpio_pin    = int(BUTTON_GPIO) if BUTTON_GPIO else None
        self._btn_held_since: float | None = None

    def _transition(self, new_state: str) -> bool:
        allowed = TRANSITIONS.get(self.state, [])
        if new_state not in allowed:
            log.warning("Invalid transition %s → %s", self.state, new_state)
            return False
        log.info("State: %s → %s  (mission=%s)", self.state, new_state, self.mission_id)
        self.state = new_state
        _post_state(self.mission_id, new_state)

        # On new FIELD_RUNNING, start a fresh mission_id
        if new_state == "FIELD_RUNNING" and self.state != "PAUSED":
            pass  # mission_id already set when ARMED

        # On MISSION_FINISHED, immediately transition to SYNCING
        if new_state == "MISSION_FINISHED":
            time.sleep(0.5)
            self._transition("SYNCING")

        return True

    def _handle_commands(self) -> None:
        for cmd in _poll_commands():
            command   = (cmd.get("command") or "").upper()
            target    = COMMAND_MAP.get(command)
            cmd_id    = cmd["id"]
            if target:
                self._transition(target)
            else:
                log.info("Unhandled command: %s", command)
            _mark_command_done(cmd_id)

    def _handle_button(self) -> None:
        if not self.gpio or not self.gpio_pin:
            return
        pressed = _read_button(self.gpio, self.gpio_pin)
        now     = time.monotonic()

        if pressed:
            if self._btn_held_since is None:
                self._btn_held_since = now
            held = now - self._btn_held_since

            # 3-second hold
            if held >= 3.0:
                self._btn_held_since = None  # reset to avoid repeat
                if self.state == "IDLE":
                    log.info("Button: 3s hold → ARM")
                    self._transition("ARMED")
                elif self.state in ("FIELD_RUNNING", "PAUSED"):
                    log.info("Button: 3s hold → STOP")
                    self._transition("MISSION_FINISHED")
        else:
            if self._btn_held_since is not None:
                held = now - self._btn_held_since
                self._btn_held_since = None
                if held < 1.0 and self.state == "ARMED":
                    log.info("Button: short press → START_FIELD")
                    self._transition("FIELD_RUNNING")
                elif held < 1.0 and self.state == "FIELD_RUNNING":
                    log.info("Button: short press → field event")
                    _post_state(self.mission_id, "FIELD_RUNNING")  # heartbeat/event

    def run(self) -> None:
        log.info("Mission state machine starting (device=%s)", DEVICE_ID)

        # BOOT → SELF_CHECK
        _post_state(self.mission_id, "BOOT")
        time.sleep(1)

        if _self_check():
            self._transition("SELF_CHECK")
            time.sleep(1)
            self._transition("IDLE")
        else:
            self._transition("ERROR")

        while True:
            try:
                self._handle_commands()
                self._handle_button()
            except Exception as e:
                log.exception("SM loop error: %s", e)
            time.sleep(POLL_S)


def main() -> None:
    sm = MissionSM()
    sm.run()


if __name__ == "__main__":
    main()
