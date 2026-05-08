#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-dry-run}"
PORT="${2:-/dev/ttyUSB0}"

echo "🚀 M.A.N.G.O Fase A runner ($MODE)"

echo "[1/2] Ejecutando pruebas unitarias..."
python3 -m unittest tests/serial_ping_stop_test.py

echo "[2/2] Ejecutando chequeo serial PING/STOP/STATUS..."
if [[ "$MODE" == "dry-run" ]]; then
  python3 -m bridge.jetson_serial.phase_a_check --dry-run
elif [[ "$MODE" == "hardware" ]]; then
  python3 -m bridge.jetson_serial.phase_a_check --port "$PORT"
else
  echo "Modo inválido: $MODE (usa dry-run | hardware [port])" >&2
  exit 1
fi

echo "✅ Fase A verificada"
