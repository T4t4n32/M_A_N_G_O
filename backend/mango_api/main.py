import logging
from fastapi import FastAPI
from mango_api.core.config import settings
from mango_api.db.base import Base
from mango_api.db.session import engine
from mango_api.middleware.access_log import AccessLogMiddleware
from mango_api.api.routes import auth, ingestion, dashboard, sensors, admin, health


logging.basicConfig(level=logging.INFO)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description="Monitoring of Aquatic & Natural Global Observations",
        version="1.0.0",
        openapi_url=f"{settings.api_prefix}/openapi.json",
        docs_url=f"{settings.api_prefix}/docs",
    )

    app.add_middleware(AccessLogMiddleware)

    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(ingestion.router, prefix=settings.api_prefix)
    app.include_router(dashboard.router, prefix=settings.api_prefix)
    app.include_router(sensors.router, prefix=settings.api_prefix)
    app.include_router(admin.router, prefix=settings.api_prefix)

    @app.on_event("startup")
    def startup() -> None:
        Base.metadata.create_all(bind=engine)

    return app


app = create_app()
