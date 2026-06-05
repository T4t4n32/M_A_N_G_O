#!/usr/bin/env sh
set -e

: "${API_HOST:=0.0.0.0}"
: "${API_PORT:=5000}"
: "${GUNICORN_APP:=wsgi:app}"
: "${GUNICORN_WORKERS:=2}"
: "${GUNICORN_THREADS:=4}"
: "${GUNICORN_TIMEOUT:=60}"
: "${GUNICORN_KEEPALIVE:=5}"
: "${GUNICORN_PRELOAD:=true}"

PRELOAD_FLAG=""
if [ "$GUNICORN_PRELOAD" = "true" ] || [ "$GUNICORN_PRELOAD" = "1" ]; then
  PRELOAD_FLAG="--preload"
fi

exec gunicorn "$GUNICORN_APP" \
  --bind "$API_HOST:$API_PORT" \
  --workers "$GUNICORN_WORKERS" \
  --threads "$GUNICORN_THREADS" \
  --timeout "$GUNICORN_TIMEOUT" \
  --keep-alive "$GUNICORN_KEEPALIVE" \
  --worker-class gthread \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  $PRELOAD_FLAG
