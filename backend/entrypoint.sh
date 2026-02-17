#!/usr/bin/env sh
set -eu

python -c "from app import create_app; from app.bootstrap import bootstrap; app=create_app(); bootstrap(app)"

exec gunicorn -b 0.0.0.0:5000 --workers 2 --threads 4 --timeout 60 wsgi:app
