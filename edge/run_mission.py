#!/usr/bin/env python3
"""Entry point for the M.A.N.G.O. mission state machine."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.mission_sm import main

if __name__ == "__main__":
    main()
