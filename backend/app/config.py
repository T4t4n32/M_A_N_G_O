import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

    # DB
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:////app/data/mango.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # CORS
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]

    # Celery
    _redis = os.getenv("REDIS_URL", "redis://redis:6379/0")
    CELERY = dict(
        broker_url=os.getenv("CELERY_BROKER_URL", _redis),
        result_backend=os.getenv("CELERY_RESULT_BACKEND", _redis),
        task_ignore_result=True,
    )

    # Prototype helpers
    AUTO_CREATE_DB = os.getenv("AUTO_CREATE_DB", "1") == "1"
    SEED_DB = os.getenv("SEED_DB", "1") == "1"
