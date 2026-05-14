#!/usr/bin/env bash
# Reinicia el contenedor mango_backend con el .env actualizado.
# Uso: bash restart_backend.sh
set -e

ENV_FILE="$(dirname "$0")/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: No se encontro .env en $ENV_FILE"
  exit 1
fi

echo "Deteniendo contenedor anterior..."
docker stop mango_backend 2>/dev/null || true
docker rm   mango_backend 2>/dev/null || true

echo "Iniciando mango_backend con .env..."
docker run -d \
  --name mango_backend \
  --network vps_default \
  --env-file "$ENV_FILE" \
  -p 127.0.0.1:8000:5000 \
  --restart unless-stopped \
  mango-backend:local

echo "Contenedor iniciado. Verificando..."
sleep 3
docker ps --filter name=mango_backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
