#!/usr/bin/env python3
"""Entry point for the M.A.N.G.O. edge local API (port 9100)."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app

if __name__ == "__main__":
    port = int(os.environ.get("EDGE_API_PORT", "9100"))
    app = create_app()
    app.run(host="0.0.0.0", port=port, debug=False)
