#!/usr/bin/env python3
"""Entry point for the M.A.N.G.O. edge sync daemon."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sync.sync_worker import main

if __name__ == "__main__":
    main()
