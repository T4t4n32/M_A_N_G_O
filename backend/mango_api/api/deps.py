import datetime
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from mango_api.core.config import settings
from mango_api.db.session import SessionLocal
from mango_api.models import User, TokenBlocklist, UserRole


bearer_scheme = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc


def token_is_blocked(db: Session, jti: str) -> bool:
    return db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first() is not None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    jti = payload.get("jti")
    if not jti or token_is_blocked(db, jti):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

    user = db.get(User, int(payload.get("sub")))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")
    return user


async def get_current_user_optional(request) -> User | None:
    auth_header = request.headers.get("authorization")
    if not auth_header:
        return None
    token = auth_header.split(" ")[-1]
    db = SessionLocal()
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        if token_is_blocked(db, payload.get("jti")):
            return None
        user = db.get(User, int(payload.get("sub")))
        if not user or not user.is_active:
            return None
        return user
    except HTTPException:
        return None
    finally:
        db.close()


def require_roles(*roles: UserRole):
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return role_checker


def enforce_institution_scope(user: User, institution_id: int) -> None:
    if user.role == UserRole.admin:
        return
    if user.institution_id != institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Institution scope mismatch",
        )
