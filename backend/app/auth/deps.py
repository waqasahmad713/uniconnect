import uuid
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.security import ACCESS_COOKIE_NAME, decode_access_token
from app.database.session import get_db
from app.users.models import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    access_cookie: Annotated[str | None, Cookie(alias=ACCESS_COOKIE_NAME)] = None,
) -> User:
    token = credentials.credentials if credentials else access_cookie
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated.")

    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
        token_version = int(payload.get("ver", 0))
    except (InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")

    user = db.get(User, user_id)
    if user is None or user.token_version != token_version:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")
    if user.is_suspended or not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is not active.")
    return user


def get_optional_user(
    db: Annotated[Session, Depends(get_db)],
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    access_cookie: Annotated[str | None, Cookie(alias=ACCESS_COOKIE_NAME)] = None,
) -> User | None:
    token = credentials.credentials if credentials else access_cookie
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
        token_version = int(payload.get("ver", 0))
    except (InvalidTokenError, KeyError, ValueError):
        return None

    user = db.get(User, user_id)
    if (
        user is None
        or user.token_version != token_version
        or user.is_suspended
        or not user.is_active
    ):
        return None
    return user


def get_current_verified_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.email_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Verify your email first.")
    return user


def get_current_admin(
    user: Annotated[User, Depends(get_current_verified_user)],
) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required.")
    return user
