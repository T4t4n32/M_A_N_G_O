"""Bridge mínimo para Fase A: envío de comandos y parseo de estado serial."""

from __future__ import annotations

import json
import time
from dataclasses import dataclass


@dataclass
class MotionCommand:
    seq: int
    cmd: str
    duration_ms: int | None = None

    def to_wire(self) -> bytes:
        payload = {"type": "cmd_motion", "seq": self.seq, "cmd": self.cmd}
        if self.duration_ms is not None:
            payload["duration_ms"] = self.duration_ms
        return (json.dumps(payload, separators=(",", ":")) + "\n").encode("utf-8")


class MotionBridge:
    def __init__(self, serial_port):
        self.serial = serial_port
        self.seq = 0

    def send(self, cmd: str, duration_ms: int | None = None) -> int:
        self.seq += 1
        command = MotionCommand(seq=self.seq, cmd=cmd, duration_ms=duration_ms)
        self.serial.write(command.to_wire())
        return self.seq

    def ping(self) -> int:
        return self.send("PING")

    def stop(self, duration_ms: int = 500) -> int:
        return self.send("STOP", duration_ms=duration_ms)

    def read_status(self, timeout_s: float = 1.0) -> dict:
        start = time.monotonic()
        while time.monotonic() - start <= timeout_s:
            raw = self.serial.readline()
            if not raw:
                continue
            return json.loads(raw.decode("utf-8").strip())
        raise TimeoutError("No se recibió motion_status en el tiempo esperado")
