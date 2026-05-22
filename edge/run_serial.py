#!/usr/bin/env python3
"""Entry point for the M.A.N.G.O. serial reader (ESP32 → edge API)."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.serial_reader import run

if __name__ == "__main__":
    run()
