"""Configuration for mango_hub — read from the shared .env file."""

import os

STATION_NAME   = os.getenv("MANGO_STATION_NAME",    "JETSON-TK1-01")
VPS_HOST       = os.getenv("MANGO_VPS_HOST",         "")
VPS_USER       = os.getenv("MANGO_VPS_USER",         "mango")
VPS_SSH_PORT   = int(os.getenv("MANGO_VPS_SSH_PORT", "22"))
TUNNEL_R_PORT  = int(os.getenv("MANGO_TUNNEL_RPORT", "9200"))
SSH_KEY        = os.getenv("MANGO_SSH_KEY",          "/home/mango/.ssh/id_rsa_tunnel")
LOG_DIR        = os.getenv("MANGO_LOG_DIR",          "/var/log/upstart")
EDITOR         = os.getenv("VISUAL", os.getenv("EDITOR", "nano"))

MANAGED_SERVICES = [
    "mango-edge-serial",
    "mango-edge-sync",
    "mango-edge-api",
    "mango-edge-sms",
    "mango-tunnel",
]
