#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-dry-run}"
PORT="${2:-/dev/ttyUSB0}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv_phase_a"
PYTHON_BIN="python3"

echo "🚀 M.A.N.G.O Fase A runner ($MODE)"

ensure_serial_dependency() {
  if python3 -c "import serial" >/dev/null 2>&1; then
    PYTHON_BIN="python3"
    return
  fi

  if [[ ! -d "$VENV_DIR" ]]; then
    echo "📦 Creando entorno virtual local: $VENV_DIR"
    python3 -m venv "$VENV_DIR"
  fi

  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  PYTHON_BIN="$VENV_DIR/bin/python"

  if "$PYTHON_BIN" -c "import serial" >/dev/null 2>&1; then
    return
  fi

  echo "📦 Intentando instalar pyserial en venv local..."
  if ! "$PYTHON_BIN" -m pip install --upgrade pip >/dev/null 2>&1; then
    true
  fi

  if ! "$PYTHON_BIN" -m pip install -r "$ROOT_DIR/bridge/jetson_serial/requirements.txt"; then
    echo "❌ No se pudo instalar pyserial automáticamente."
    echo "Opciones:"
    echo "  1) Instala paquete del sistema: sudo apt install python3-serial"
    echo "  2) O instala en venv manualmente cuando tengas internet:"
    echo "     source $VENV_DIR/bin/activate && pip install pyserial"
    exit 3
  fi
}

echo "[1/3] Verificando conflictos de merge..."
./scripts/check-git-conflicts.sh

echo "[2/3] Ejecutando pruebas unitarias..."
python3 -m unittest tests/serial_ping_stop_test.py

echo "[3/3] Ejecutando chequeo serial PING/STOP/STATUS..."
if [[ "$MODE" == "dry-run" ]]; then
  python3 -m bridge.jetson_serial.phase_a_check --dry-run
elif [[ "$MODE" == "hardware" ]]; then
  ensure_serial_dependency

  if [[ ! -e "$PORT" ]]; then
    echo "❌ Puerto no encontrado: $PORT"
    echo "Tip: revisa puertos con: ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null"
    exit 2
  fi

  "$PYTHON_BIN" -m bridge.jetson_serial.phase_a_check --port "$PORT"
else
  echo "Modo inválido: $MODE (usa dry-run | hardware [port])" >&2
  exit 1
fi

echo "✅ Fase A verificada"
