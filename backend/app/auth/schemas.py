import re
import secrets
import uuid

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.core.enums import UserRole


def slugify_name(full_name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", full_name.lower()).strip("-")
    slug = slug[:40] or "member"
    return f"{slug}-{secrets.token_hex(2)}"


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str
    university: str = Field(min_length=2, max_length=200)
    department: str = Field(min_length=2, max_length=200)
    role: UserRole
    batch: str | None = Field(default=None, max_length=20)
    registration_number: str | None = Field(default=None, max_length=80)

    @field_validator("full_name", "university", "department")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def passwords_match(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class MessageResponse(BaseModel):
    message: str
    verification_url: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: uuid.UUID
    username: str
    full_name: str
    university: str
    department: str
    role: UserRole
    batch: str | None
    bio: str | None
    current_job: str | None
    company: str | None
    location: str | None
    linkedin_url: str | None
    github_url: str | None
    portfolio_url: str | None
    profile_picture_url: str | None
    affiliation_verified: bool
    skills: list[str] = []

    model_config = {"from_attributes": True}


class UserMe(UserPublic):
    email: EmailStr
    email_verified: bool
    is_admin: bool
    registration_number: str | None = None
    show_registration_number: bool = False


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class ChangePasswordRequest(BaseModel):
    current_password: str
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self) -> "ChangePasswordRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self
