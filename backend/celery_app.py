import logging
import os

from celery import Celery

from app import create_app


def _env(key: str, default: str) -> str:
    val = os.getenv(key)
    return val if val not in (None, "") else default


def make_celery() -> tuple[Celery, object]:
    """
    Crea una instancia de Celery integrada con el app factory de Flask,
    para que las tareas tengan app_context (DB, config, etc).
    """
    flask_app = create_app()

    broker_url = _env("CELERY_BROKER_URL", _env("REDIS_URL", "redis://redis:6379/0"))
    result_backend = _env("CELERY_RESULT_BACKEND", _env("REDIS_URL", "redis://redis:6379/0"))

    celery = Celery(
        flask_app.import_name,
        broker=broker_url,
        backend=result_backend,
        include=["app.tasks"],  # si existe app/tasks
    )

    # Config base de Celery (pro pero simple)
    celery.conf.update(
        timezone=_env("CELERY_TIMEZONE", "UTC"),
        enable_utc=True,
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        task_track_started=True,
        worker_prefetch_multiplier=1,
        task_acks_late=True,
    )

    # Tareas con contexto Flask
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with flask_app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask

    # Autodescubrimiento (si tu estructura real lo tiene)
    try:
        celery.autodiscover_tasks(["app.tasks"])
    except Exception:
        # No forzamos a que exista app/tasks todavía
        logging.getLogger("mango.celery").warning(
            "Celery task autodiscovery failed — no tasks registered from app.tasks",
            exc_info=True,
        )

    return celery, flask_app


celery, flask_app = make_celery()


@celery.task(name="mango.ping")
def ping():
    return {"ok": True, "message": "pong"}
