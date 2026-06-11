#!/usr/bin/env sh
set -e

: "${API_HOST:=0.0.0.0}"
: "${API_PORT:=5000}"
: "${GUNICORN_APP:=wsgi:app}"
: "${GUNICORN_WORKERS:=4}"
: "${GUNICORN_THREADS:=4}"
: "${GUNICORN_TIMEOUT:=1800}"
: "${GUNICORN_KEEPALIVE:=75}"
: "${GUNICORN_PRELOAD:=true}"
: "${GUNICORN_WORKER_TMP_DIR:=/dev/shm}"

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
  --worker-tmp-dir "$GUNICORN_WORKER_TMP_DIR" \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  $PRELOAD_FLAG
