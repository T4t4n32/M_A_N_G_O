#!/usr/bin/env bash
# MANGO Hub — VPS launcher
# Run from the repo root or from anywhere; sets PYTHONPATH and mode.

REPO="$(cd "$(dirname "$0")/../.." && pwd)"

export MANGO_HUB_MODE=vps
export MANGO_STATION_NAME="${MANGO_STATION_NAME:-VPS-integramosoe}"
export PYTHONPATH="$REPO/opt"

exec python3 -m mango_hub "$@"
