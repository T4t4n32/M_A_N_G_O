"""
Celery app (tareas async) integrada con Flask (application factory).

Uso (Linux/Docker):
  celery -A celery_app.celery worker -l info

Uso (Windows) recomendado:
  celery -A celery_app.celery worker -l info -P solo
"""

from __future__ import annotations

from pathlib import Path
import os

from dotenv import load_dotenv
from celery import Celery

BASE_DIR = Path(__file__).resolve().parent

def _load_env_files() -> None:
    for filename in (".env.local", ".env"):
        p = BASE_DIR / filename
        if p.exists():
            load_dotenv(p, override=False)
            break

_load_env_files()

from app import create_app  # noqa: E402


def make_celery(flask_app) -> Celery:
    """
    Crea instancia Celery atada al contexto de Flask.
    Todas las tareas corren dentro de app.app_context().
    """
    broker_url = (
        os.getenv("CELERY_BROKER_URL")
        or os.getenv("REDIS_URL")
        or "redis://localhost:6379/0"
    )

    result_backend = (
        os.getenv("CELERY_RESULT_BACKEND")
        or os.getenv("REDIS_URL")
        or broker_url
    )

    celery = Celery(
        flask_app.import_name,
        broker=broker_url,
        backend=result_backend,
    )

    celery.conf.update(
        timezone=os.getenv("CELERY_TIMEZONE", "UTC"),
        enable_utc=True,

        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",

        task_track_started=True,
        broker_connection_retry_on_startup=True,

        worker_prefetch_multiplier=1,
        task_acks_late=True,

        result_expires=int(os.getenv("CELERY_RESULT_EXPIRES", "3600")),
    )

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with flask_app.app_context():
                return super().__call__(*args, **kwargs)

    celery.Task = ContextTask
    return celery


# Creamos Flask app una sola vez (factory)
flask_app = create_app()

# Celery global para el comando:
# celery -A celery_app.celery worker -l info
celery = make_celery(flask_app)


@celery.task(name="mango.health.ping")
def ping():
    """
    Tarea simple para verificar que Celery está vivo.
    """
    return {"ok": True}
