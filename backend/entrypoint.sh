#!/usr/bin/env sh
set -eu

echo "[mango] entrypoint start"

: "${API_HOST:=0.0.0.0}"
: "${API_PORT:=5000}"

: "${GUNICORN_APP:=wsgi:app}"
: "${GUNICORN_WORKERS:=2}"
: "${GUNICORN_THREADS:=4}"
: "${GUNICORN_TIMEOUT:=60}"

# Wait for DB (best-effort)
if [ -n "${DATABASE_URL:-}" ]; then
  echo "[mango] waiting for database..."
  for i in $(seq 1 30); do
    python -c "import os; from sqlalchemy import create_engine, text; e=create_engine(os.environ['DATABASE_URL'], pool_pre_ping=True); c=e.connect(); c.execute(text('SELECT 1')); c.close()" \
      && echo "[mango] database ready" && break \
      || true
    echo "[mango] db not ready ($i/30)..."
    sleep 2
  done
fi

# Migrations (optional)
if [ -f "/app/alembic.ini" ]; then
  echo "[mango] running alembic upgrade head"
  alembic upgrade head || echo "[mango] WARNING: alembic failed; continuing"
elif [ -d "/app/migrations" ]; then
  echo "[mango] migrations folder found; trying flask db upgrade"
  export FLASK_APP="${FLASK_APP:-wsgi.py}"
  flask db upgrade || echo "[mango] WARNING: flask db upgrade failed; continuing"
else
  echo "[mango] no migration config found; skipping migrations"
fi

echo "[mango] starting gunicorn ${GUNICORN_APP} on ${API_HOST}:${API_PORT}"
exec gunicorn -b "${API_HOST}:${API_PORT}" \
  --workers "${GUNICORN_WORKERS}" \
  --threads "${GUNICORN_THREADS}" \
  --timeout "${GUNICORN_TIMEOUT}" \
  --access-logfile - \
  --error-logfile - \
  "${GUNICORN_APP}"
