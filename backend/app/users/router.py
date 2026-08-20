from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.auth.deps import get_current_verified_user
from app.auth.router import to_user_me
from app.auth.schemas import UserMe, UserPublic
from app.core.files import save_avatar
from app.database.session import get_db
from app.users.models import User, UserSkill

router = APIRouter(prefix="/api/users", tags=["users"])


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    bio: str | None = Field(default=None, max_length=2000)
    current_job: str | None = Field(default=None, max_length=200)
    company: str | None = Field(default=None, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    linkedin_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    portfolio_url: str | None = Field(default=None, max_length=500)
    department: str | None = Field(default=None, max_length=200)
    batch: str | None = Field(default=None, max_length=20)
    registration_number: str | None = Field(default=None, max_length=80)
    show_registration_number: bool | None = None
    skills: list[str] | None = None


def to_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
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
    )


@router.get("/me")
def read_me(user: Annotated[User, Depends(get_current_verified_user)]) -> UserMe:
    return to_user_me(user)


@router.patch("/me")
def update_me(
    payload: ProfileUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> UserMe:
    data = payload.model_dump(exclude_unset=True)
    skills = data.pop("skills", None)
    for field, value in data.items():
        setattr(user, field, value)
    if skills is not None:
        user.skills.clear()
        seen: set[str] = set()
        for raw in skills:
            name = raw.strip()
            if not name or name.lower() in seen:
                continue
            seen.add(name.lower())
            user.skills.append(UserSkill(name=name))
    db.commit()
    db.refresh(user)
    return to_user_me(user)


@router.post("/me/photo")
async def upload_photo(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
    file: Annotated[UploadFile, File()],
) -> UserMe:
    user.profile_picture_url = await save_avatar(str(user.id), file)
    db.commit()
    db.refresh(user)
    return to_user_me(user)


@router.get("/search")
def search_users(
    db: Annotated[Session, Depends(get_db)],
    q: str | None = None,
    university: str | None = None,
    department: str | None = None,
    batch: str | None = None,
    role: str | None = None,
    skill: str | None = None,
    location: str | None = None,
    company: str | None = None,
    job_title: str | None = None,
) -> list[UserPublic]:
    query = (
        select(User)
        .options(selectinload(User.skills))
        .where(User.is_active.is_(True), User.is_suspended.is_(False))
    )
    if q:
        pattern = f"%{q.strip()}%"
        query = query.where(
            or_(
                User.full_name.ilike(pattern),
                User.username.ilike(pattern),
                User.bio.ilike(pattern),
                User.current_job.ilike(pattern),
            )
        )
    if university:
        query = query.where(User.university.ilike(f"%{university}%"))
    if department:
        query = query.where(User.department.ilike(f"%{department}%"))
    if batch:
        query = query.where(User.batch == batch)
    if role:
        query = query.where(User.role == role)
    if location:
        query = query.where(User.location.ilike(f"%{location}%"))
    if company:
        query = query.where(User.company.ilike(f"%{company}%"))
    if job_title:
        query = query.where(User.current_job.ilike(f"%{job_title}%"))
    if skill:
        query = query.join(UserSkill).where(UserSkill.name.ilike(f"%{skill}%"))

    users = db.scalars(query.order_by(User.full_name).limit(50)).unique().all()
    return [to_public(user) for user in users]


@router.get("/{username}")
def read_profile(username: str, db: Annotated[Session, Depends(get_db)]) -> UserPublic:
    user = db.scalar(
        select(User)
        .options(selectinload(User.skills))
        .where(User.username == username)
    )
    if user is None or user.is_suspended:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found.")
    return to_public(user)
