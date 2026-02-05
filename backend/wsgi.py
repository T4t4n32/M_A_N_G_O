"""
WSGI entrypoint (producción / Docker / VPS Linux).

- En Linux: usado por Gunicorn/uwsgi
- En Windows: NO uses gunicorn. Si quieres modo "producción" en Windows:
    pip install waitress
    waitress-serve --listen=127.0.0.1:5000 wsgi:app
"""

from __future__ import annotations

from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

def _load_env_files() -> None:
    """
    Carga variables desde .env.local o .env si existen.
    No pisa variables ya definidas por el sistema.
    """
    for filename in (".env.local", ".env"):
        p = BASE_DIR / filename
        if p.exists():
            load_dotenv(p, override=False)
            break

_load_env_files()

# Import tardío para que dotenv cargue antes de crear la app
from app import create_app  # noqa: E402

app = create_app()

if __name__ == "__main__":
    # Útil para depurar rápido
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "5000"))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    app.run(host=host, port=port, debug=debug)
