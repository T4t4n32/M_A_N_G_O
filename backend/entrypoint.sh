#!/usr/bin/env sh
set -e

# Crea tablas y verifica DB antes de levantar gunicorn
python -m app.bootstrap

exec "$@"
