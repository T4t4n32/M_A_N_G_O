#!/bin/bash
#
# run-all.sh — Start all M.A.N.G.O services with a single command.
#
# This helper script makes it easy to bring up the full M.A.N.G.O stack
# (database, Redis, backend API, web frontend and LoRa bridge) without
# having to remember multiple commands.  It wraps `docker compose` to
# combine the primary `compose.yaml` and the LoRa-specific `compose.rx.yaml`.
#
# Usage:
#   ./scripts/run-all.sh [mode]
#
# Where `mode` can be either `dummy` (default) or `hardware`:
#   dummy    – run the LoRa bridge in synthetic mode, no hardware required
#   hardware – run the LoRa bridge against a real serial device (/dev/ttyUSB0)
#
# Examples:
#   ./scripts/run-all.sh           # start services with dummy LoRa data
#   ./scripts/run-all.sh hardware  # start services with real LoRa hardware

set -euo pipefail

# Determine mode from first argument or fallback to dummy.
MODE="${1:-dummy}"
if [[ "$MODE" != "dummy" && "$MODE" != "hardware" ]]; then
  echo "Invalid mode: $MODE"
  echo "Valid modes: dummy, hardware"
  exit 1
fi

echo "🚀 Starting M.A.N.G.O services (mode: $MODE)"

# Check if docker compose or docker-compose is available
if command -v docker compose &>/dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "❌ docker compose is not installed. Please install Docker and docker compose."
  exit 1
fi

# Use both compose files. Profiles allow selecting dummy or hardware services.
$DOCKER_COMPOSE -f compose.yaml -f compose.rx.yaml --profile "$MODE" up -d

echo "✅ All services are up!"
echo "Visit the backend API at http://localhost:${API_HOST_PORT:-8000} and the web UI at http://localhost:${NGINX_HTTP_PORT:-8080}"
echo "To stop services, run: $DOCKER_COMPOSE -f compose.yaml -f compose.rx.yaml down"