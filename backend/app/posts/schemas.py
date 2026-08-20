from datetime import datetime
import uuid

from pydantic import BaseModel, Field

from app.core.enums import PostType, ReportReason
from app.auth.schemas import UserPublic


class PostCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=10, max_length=20000)
    post_type: PostType
    tags: list[str] = []
    image_url: str | None = None
    document_url: str | None = None
    external_url: str | None = None
    github_url: str | None = None


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    parent_id: uuid.UUID | None = None


class ReportCreate(BaseModel):
    reason: ReportReason
    details: str | None = Field(default=None, max_length=2000)


class CommentOut(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime
    parent_id: uuid.UUID | None
    author: UserPublic

    model_config = {"from_attributes": True}


class PostOut(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    post_type: PostType
    tags: list[str]
    image_url: str | None
    document_url: str | None
    external_url: str | None
    github_url: str | None
    is_featured: bool
    created_at: datetime
    updated_at: datetime
    like_count: int = 0
    comment_count: int = 0
    liked: bool = False
    saved: bool = False
    is_owner: bool = False
    author: UserPublic

    model_config = {"from_attributes": True}
