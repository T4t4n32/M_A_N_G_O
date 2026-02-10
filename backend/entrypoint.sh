#!/bin/sh
set -e

: "${GUNICORN_WORKERS:=2}"
: "${GUNICORN_THREADS:=4}"
: "${GUNICORN_TIMEOUT:=60}"

exec gunicorn \
  --bind 0.0.0.0:5000 \
  --workers "$GUNICORN_WORKERS" \
  --threads "$GUNICORN_THREADS" \
  --timeout "$GUNICORN_TIMEOUT" \
  wsgi:app
