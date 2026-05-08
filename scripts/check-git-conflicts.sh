#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔍 Revisando conflictos de merge en archivos de código/documentación..."

# Buscar marcadores de conflicto al inicio de línea para evitar falsos positivos con '====' decorativos.
matches=$(rg -n "^(<<<<<<<|=======|>>>>>>>)" \
  bridge docs scripts tests firmware edge backend \
  --glob '!hardware/components/LoRa/**' || true)

if [[ -n "$matches" ]]; then
  echo "❌ Se encontraron marcadores de conflicto:" 
  echo "$matches"
  exit 1
fi

echo "✅ No se detectaron conflictos de merge en rutas principales."
