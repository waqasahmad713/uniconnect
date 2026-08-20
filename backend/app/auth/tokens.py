from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_email
from app.core.enums import utc_now
from app.core.security import generate_url_token, hash_token
from app.users.models import EmailVerificationToken, PasswordResetToken, User

VERIFICATION_HOURS = 24
RESET_HOURS = 1


def _expires_in(*, hours: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def issue_email_verification(db: Session, user: User) -> str:
    raw_token = generate_url_token()
    db.add(
        EmailVerificationToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=_expires_in(hours=VERIFICATION_HOURS),
        )
    )
    db.commit()
    verify_url = f"{settings.frontend_url}/verify-email?token={raw_token}"
    send_email(
        user.email,
        "Verify your UniConnect email",
        f"Hello {user.full_name},\n\nConfirm your email by opening this link:\n{verify_url}\n\nThis link expires in {VERIFICATION_HOURS} hours.",
    )
    return raw_token


def issue_password_reset(db: Session, user: User) -> str:
    raw_token = generate_url_token()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=_expires_in(hours=RESET_HOURS),
        )
    )
    db.commit()
    reset_url = f"{settings.frontend_url}/reset-password?token={raw_token}"
    send_email(
        user.email,
        "Reset your UniConnect password",
        f"Hello {user.full_name},\n\nReset your password by opening this link:\n{reset_url}\n\nThis link expires in {RESET_HOURS} hour and can be used once.",
    )
    return raw_token


def consume_verification_token(db: Session, token: str) -> User:
    token_row = db.scalar(
        select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == hash_token(token)
        )
    )
    if (
        token_row is None
        or token_row.used_at is not None
        or token_row.expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification link.")

    user = db.get(User, token_row.user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification link.")

    user.email_verified = True
    token_row.used_at = utc_now()
    db.commit()
    db.refresh(user)
    return user


def consume_reset_token(db: Session, token: str) -> tuple[User, PasswordResetToken]:
    token_row = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hash_token(token)
        )
    )
    if (
        token_row is None
        or token_row.used_at is not None
        or token_row.expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link.")

    user = db.get(User, token_row.user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link.")
    return user, token_row
