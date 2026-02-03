from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from mango_api.db.session import SessionLocal
from mango_api.models.access_log import AccessLog
from mango_api.api.deps import get_current_user_optional


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        db = SessionLocal()
        try:
            user = await get_current_user_optional(request)
            log_entry = AccessLog(
                user_id=user.id if user else None,
                path=request.url.path,
                method=request.method,
                status_code=response.status_code,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            db.add(log_entry)
            db.commit()
        finally:
            db.close()

        return response
