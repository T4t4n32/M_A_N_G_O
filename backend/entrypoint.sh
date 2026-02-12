#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] Bootstrapping database schema..."
python -c "from app import create_app; app=create_app(); from app.bootstrap import bootstrap_db; bootstrap_db(app)"

echo "[entrypoint] Starting gunicorn..."
exec gunicorn \
  --bind 0.0.0.0:5000 \
  --workers "${GUNICORN_WORKERS:-2}" \
  --threads "${GUNICORN_THREADS:-4}" \
  --timeout "${GUNICORN_TIMEOUT:-60}" \
  "wsgi:app"
