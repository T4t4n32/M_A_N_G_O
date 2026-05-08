"""CLI de verificación Fase A desde un solo punto."""

from __future__ import annotations

import argparse
import json
import sys
import time

from bridge.jetson_serial.motion_bridge import MotionBridge


class FakeSerial:
    def __init__(self):
        self.writes = []
        self.inbox = []

    def write(self, data: bytes):
        self.writes.append(data)
        msg = json.loads(data.decode("utf-8").strip())
        if msg.get("cmd") in {"PING", "STOP", "STATUS"}:
            self.inbox.append(
                json.dumps(
                    {
                        "type": "motion_status",
                        "seq_ack": msg["seq"],
                        "mode": "SAFE",
                        "left_pwm": 1500,
                        "right_pwm": 1500,
                        "vertical_pwm": 1500,
                        "error": "NONE",
                    }
                ).encode("utf-8")
                + b"\n"
            )

    def readline(self) -> bytes:
        if self.inbox:
            return self.inbox.pop(0)
        return b""


def run_check(serial_port, stop_interval_ms: int = 500, cycles: int = 3) -> int:
    bridge = MotionBridge(serial_port)

    seq = bridge.ping()
    status = bridge.read_status(timeout_s=1.0)
    print(f"PING seq={seq} -> {status}")

    for _ in range(cycles):
        seq = bridge.stop(duration_ms=stop_interval_ms)
        status = bridge.read_status(timeout_s=1.0)
        print(f"STOP seq={seq} -> {status}")
        time.sleep(stop_interval_ms / 1000)

    seq = bridge.send("STATUS")
    status = bridge.read_status(timeout_s=1.0)
    print(f"STATUS seq={seq} -> {status}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Chequeo Fase A (PING/STOP/STATUS)")
    parser.add_argument("--dry-run", action="store_true", help="Usa puerto serial simulado")
    parser.add_argument("--port", help="Puerto serial real, ej: /dev/ttyUSB0")
    parser.add_argument("--baud", type=int, default=115200)
    args = parser.parse_args()

    if args.dry_run:
        return run_check(FakeSerial())

    if not args.port:
        print("Error: usa --dry-run o define --port", file=sys.stderr)
        return 2

    try:
        import serial  # type: ignore
    except ImportError:
        print("pyserial no está instalado. Ejecuta: pip install pyserial", file=sys.stderr)
        return 3

    with serial.Serial(args.port, args.baud, timeout=0.2) as ser:
        return run_check(ser)


if __name__ == "__main__":
    raise SystemExit(main())
