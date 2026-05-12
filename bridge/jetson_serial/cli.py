#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cli.py — Pequeña REPL para probar el cliente MangoSerial desde terminal.

Uso:
    python3 cli.py                 # auto-detecta el puerto
    python3 cli.py /dev/ttyUSB0    # puerto explícito

Comandos soportados:
    ping
    stop
    status
    mode safe | mode manual | mode auto
    quit
"""

import sys
import logging
from mango_serial import MangoSerialClient


def main():
    port = sys.argv[1] if len(sys.argv) > 1 else None
    logging.getLogger("mango.serial").setLevel(logging.INFO)

    with MangoSerialClient(port=port) as client:
        print("M.A.N.G.O. CLI — escribe 'quit' para salir.")
        while True:
            try:
                line = input("> ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print()
                break
            if not line:
                continue
            if line in ("quit", "exit", "q"):
                break
            try:
                if line == "ping":
                    print(client.ping())
                elif line == "stop":
                    print(client.stop())
                elif line == "status":
                    print(client.status())
                elif line.startswith("mode "):
                    print(client.set_mode(line.split(None, 1)[1]))
                else:
                    print("comandos: ping | stop | status | mode {safe|manual|auto} | quit")
            except TimeoutError as e:
                print("TIMEOUT:", e)
            except Exception as e:
                print("ERROR:", e)


if __name__ == "__main__":
    main()