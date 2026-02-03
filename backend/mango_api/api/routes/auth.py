import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from mango_api.core.config import settings
from mango_api.core.security import create_token, verify_password
from mango_api.models import User, TokenBlocklist
from mango_api.schemas.auth import TokenPair, LoginRequest, RefreshRequest
from mango_api.api.deps import get_db, decode_token


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPair:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")

    user.last_login_at = datetime.datetime.utcnow()

    access_token = create_token(
        str(user.id),
        "access",
        datetime.timedelta(minutes=settings.access_token_exp_minutes),
    )
    refresh_token = create_token(
        str(user.id),
        "refresh",
        datetime.timedelta(days=settings.refresh_token_exp_days),
    )

    db.commit()

    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPair:
    token_payload = decode_token(payload.refresh_token)
    if token_payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    jti = token_payload.get("jti")
    if db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")

    user = db.get(User, int(token_payload.get("sub")))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")

    access_token = create_token(
        str(user.id),
        "access",
        datetime.timedelta(minutes=settings.access_token_exp_minutes),
    )
    refresh_token = create_token(
        str(user.id),
        "refresh",
        datetime.timedelta(days=settings.refresh_token_exp_days),
    )

    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
def logout(payload: RefreshRequest, db: Session = Depends(get_db)) -> dict:
    token_payload = decode_token(payload.refresh_token)
    jti = token_payload.get("jti")
    expires_at = datetime.datetime.utcfromtimestamp(token_payload.get("exp"))

    # Security: explicit revocation prevents reuse of compromised refresh tokens.
    db.add(TokenBlocklist(jti=jti, token_type=token_payload.get("type"), expires_at=expires_at))
    db.commit()

    return {"status": "logged_out"}
