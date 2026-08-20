from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserMe,
    VerifyEmailRequest,
    slugify_name,
)
from app.auth.tokens import (
    consume_reset_token,
    consume_verification_token,
    issue_email_verification,
    issue_password_reset,
)
from app.core.config import settings
from app.core.enums import utc_now
from app.core.security import (
    ACCESS_COOKIE_NAME,
    create_access_token,
    hash_password,
    password_needs_rehash,
    verify_password,
)
from app.database.session import get_db
from app.users.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

GENERIC_RESET_MESSAGE = (
    "If an account exists for that email, a reset link has been sent."
)


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        ACCESS_COOKIE_NAME,
        token,
        max_age=60 * 60,
        **settings.cookie_flags(),
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE_NAME, **settings.cookie_flags())


def _verification_url(db: Session, user: User) -> str | None:
    if not settings.is_dev:
        issue_email_verification(db, user)
        return None
    raw_token = issue_email_verification(db, user)
    return f"{settings.frontend_url}/verify-email?token={raw_token}"


def to_user_me(user: User) -> UserMe:
    return UserMe(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        university=user.university,
        department=user.department,
        role=user.role,
        batch=user.batch,
        bio=user.bio,
        current_job=user.current_job,
        company=user.company,
        location=user.location,
        linkedin_url=user.linkedin_url,
        github_url=user.github_url,
        portfolio_url=user.portfolio_url,
        profile_picture_url=user.profile_picture_url,
        affiliation_verified=user.affiliation_verified,
        skills=[skill.name for skill in user.skills],
        email_verified=user.email_verified,
        is_admin=user.is_admin,
        registration_number=user.registration_number,
        show_registration_number=user.show_registration_number,
    )


@router.post("/register")
def register(
    payload: RegisterRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing and existing.email_verified:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "An account with this email already exists."
        )
    if existing and not existing.email_verified:
        verify_url = _verification_url(db, existing)
        return MessageResponse(
            message="This email is registered but not verified yet. Click the verification link below — no inbox email is sent in local development.",
            verification_url=verify_url,
        )

    username = slugify_name(payload.full_name)
    while db.scalar(select(User).where(User.username == username)):
        username = slugify_name(payload.full_name)

    email = str(payload.email).lower()
    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        username=username,
        university=payload.university,
        department=payload.department,
        role=payload.role,
        batch=payload.batch,
        registration_number=payload.registration_number,
        email_verified=False,
        is_admin=settings.is_listed_admin_email(email),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    verify_url = _verification_url(db, user)
    response.status_code = status.HTTP_201_CREATED
    return MessageResponse(
        message="Account created. No inbox email is sent in local development — click the verification link below.",
        verification_url=verify_url,
    )


@router.post("/login")
def login(
    payload: LoginRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password.")
    if user.is_suspended or not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is not active.")
    if not user.email_verified:
        verify_url = _verification_url(db, user)
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            {
                "message": "Verify your email before logging in. No inbox email is sent in local development.",
                "verification_url": verify_url,
            },
        )

    if settings.is_listed_admin_email(user.email) and not user.is_admin:
        user.is_admin = True
    if password_needs_rehash(user.hashed_password):
        user.hashed_password = hash_password(payload.password)
    user.last_login_at = utc_now()
    db.commit()
    token = create_access_token(user_id=str(user.id), token_version=user.token_version)
    _set_auth_cookie(response, token)
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout(response: Response) -> MessageResponse:
    _clear_auth_cookie(response)
    return MessageResponse(message="Signed out.")


@router.post("/verify-email")
def verify_email(
    payload: VerifyEmailRequest, db: Annotated[Session, Depends(get_db)]
) -> MessageResponse:
    consume_verification_token(db, payload.token)
    return MessageResponse(message="Email verified. You can log in now.")


@router.post("/resend-verification")
def resend_verification(
    payload: ForgotPasswordRequest, db: Annotated[Session, Depends(get_db)]
) -> MessageResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    verify_url = None
    if user and not user.email_verified:
        verify_url = _verification_url(db, user)
    return MessageResponse(
        message="If an unverified account exists for that email, a new verification link is ready.",
        verification_url=verify_url,
    )


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest, db: Annotated[Session, Depends(get_db)]
) -> MessageResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user:
        issue_password_reset(db, user)
    return MessageResponse(message=GENERIC_RESET_MESSAGE)


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    user, token_row = consume_reset_token(db, payload.token)
    user.hashed_password = hash_password(payload.password)
    user.token_version += 1
    token_row.used_at = utc_now()
    db.commit()
    _clear_auth_cookie(response)
    return MessageResponse(message="Password updated. You can log in with the new password.")


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> MessageResponse:
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect.")
    user.hashed_password = hash_password(payload.password)
    user.token_version += 1
    db.commit()
    token = create_access_token(user_id=str(user.id), token_version=user.token_version)
    _set_auth_cookie(response, token)
    return MessageResponse(message="Password updated.")


@router.get("/me")
def read_me(user: Annotated[User, Depends(get_current_user)]) -> UserMe:
    return to_user_me(user)
