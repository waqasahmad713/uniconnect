import re
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.auth.deps import get_current_verified_user, get_optional_user
from app.core.enums import NotificationType, PostType, ReportTargetType
from app.database.session import get_db
from app.notifications.service import notify
from app.posts.models import Bookmark, Comment, Like, Post, Tag
from app.posts.schemas import CommentCreate, CommentOut, PostCreate, PostOut, ReportCreate
from app.reports.models import Report
from app.users.models import User
from app.users.router import to_public

router = APIRouter(prefix="/api/posts", tags=["posts"])


def _slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:60] or "tag"


def _get_or_create_tags(db: Session, names: list[str]) -> list[Tag]:
    tags: list[Tag] = []
    seen: set[str] = set()
    for raw in names:
        name = raw.strip().lstrip("#")
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        tag = db.scalar(select(Tag).where(Tag.slug == _slug(name)))
        if tag is None:
            tag = Tag(name=name, slug=_slug(name))
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


def serialize_post(post: Post, user: User | None, db: Session) -> PostOut:
    like_count = db.scalar(select(func.count()).select_from(Like).where(Like.post_id == post.id)) or 0
    comment_count = (
        db.scalar(select(func.count()).select_from(Comment).where(Comment.post_id == post.id, Comment.is_removed.is_(False)))
        or 0
    )
    liked = False
    saved = False
    if user:
        liked = db.scalar(select(Like).where(Like.post_id == post.id, Like.user_id == user.id)) is not None
        saved = (
            db.scalar(select(Bookmark).where(Bookmark.post_id == post.id, Bookmark.user_id == user.id))
            is not None
        )
    return PostOut(
        id=post.id,
        title=post.title,
        content=post.content,
        post_type=post.post_type,
        tags=[tag.name for tag in post.tags],
        image_url=post.image_url,
        document_url=post.document_url,
        external_url=post.external_url,
        github_url=post.github_url,
        is_featured=post.is_featured,
        created_at=post.created_at,
        updated_at=post.updated_at,
        like_count=like_count,
        comment_count=comment_count,
        liked=liked,
        saved=saved,
        is_owner=bool(user and user.id == post.author_id),
        author=to_public(post.author),
    )


def _visible_posts():
    return select(Post).options(selectinload(Post.tags), selectinload(Post.author).selectinload(User.skills)).where(
        Post.is_removed.is_(False)
    )


@router.get("")
def list_posts(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
    post_type: str | None = None,
    exclude_type: str | None = None,
    q: str | None = None,
) -> list[PostOut]:
    query = _visible_posts()
    if post_type:
        query = query.where(Post.post_type == post_type)
    if exclude_type:
        query = query.where(Post.post_type != exclude_type)
    if q:
        query = query.where(or_(Post.title.ilike(f"%{q}%"), Post.content.ilike(f"%{q}%")))
    posts = db.scalars(query.order_by(Post.is_featured.desc(), Post.created_at.desc()).limit(50)).all()
    return [serialize_post(post, user, db) for post in posts]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> PostOut:
    if not user.is_admin and payload.post_type != PostType.QUESTION:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Members can only post questions. Feed posts are published from the admin console.",
        )
    post = Post(
        author_id=user.id,
        title=payload.title.strip(),
        content=payload.content.strip(),
        post_type=payload.post_type,
        image_url=payload.image_url,
        document_url=payload.document_url,
        external_url=payload.external_url,
        github_url=payload.github_url,
        tags=_get_or_create_tags(db, payload.tags),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post = db.scalar(_visible_posts().where(Post.id == post.id))
    assert post is not None
    return serialize_post(post, user, db)


@router.get("/{post_id}")
def read_post(
    post_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)],
) -> PostOut:
    post = db.scalar(_visible_posts().where(Post.id == post_id))
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    return serialize_post(post, user, db)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> None:
    post = db.get(Post, post_id)
    if post is None or post.is_removed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    if post.author_id != user.id and not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only delete your own posts.")
    db.delete(post)
    db.commit()


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    post_id: uuid.UUID,
    comment_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> None:
    comment = db.get(Comment, comment_id)
    if comment is None or comment.post_id != post_id or comment.is_removed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comment not found.")
    if comment.author_id != user.id and not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only delete your own comments.")
    db.delete(comment)
    db.commit()


def _like_count(db: Session, post_id: uuid.UUID) -> int:
    return db.scalar(select(func.count()).select_from(Like).where(Like.post_id == post_id)) or 0


@router.post("/{post_id}/like")
def toggle_like(
    post_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> dict[str, bool | int]:
    post = db.get(Post, post_id)
    if post is None or post.is_removed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    existing = db.scalar(select(Like).where(Like.post_id == post_id, Like.user_id == user.id))
    if existing:
        db.delete(existing)
        db.commit()
        return {"liked": False, "like_count": _like_count(db, post_id)}
    db.add(Like(user_id=user.id, post_id=post_id))
    notify(
        db,
        user_id=post.author_id,
        actor_id=user.id,
        type=NotificationType.POST_LIKE,
        title="New like",
        body=f"{user.full_name} liked your post “{post.title}”.",
        data={"post_id": str(post.id)},
    )
    db.commit()
    return {"liked": True, "like_count": _like_count(db, post_id)}


@router.post("/{post_id}/save")
def toggle_save(
    post_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> dict[str, bool]:
    post = db.get(Post, post_id)
    if post is None or post.is_removed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    existing = db.scalar(select(Bookmark).where(Bookmark.post_id == post_id, Bookmark.user_id == user.id))
    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False}
    db.add(Bookmark(user_id=user.id, post_id=post_id))
    db.commit()
    return {"saved": True}


@router.get("/{post_id}/comments")
def list_comments(post_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> list[CommentOut]:
    comments = db.scalars(
        select(Comment)
        .options(selectinload(Comment.author).selectinload(User.skills))
        .where(Comment.post_id == post_id, Comment.is_removed.is_(False))
        .order_by(Comment.created_at)
    ).all()
    return [
        CommentOut(
            id=comment.id,
            content=comment.content,
            created_at=comment.created_at,
            parent_id=comment.parent_id,
            author=to_public(comment.author),
        )
        for comment in comments
    ]


@router.post("/{post_id}/comments", status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: uuid.UUID,
    payload: CommentCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> CommentOut:
    post = db.get(Post, post_id)
    if post is None or post.is_removed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    comment = Comment(
        post_id=post_id,
        author_id=user.id,
        parent_id=payload.parent_id,
        content=payload.content.strip(),
    )
    db.add(comment)
    notify(
        db,
        user_id=post.author_id,
        actor_id=user.id,
        type=NotificationType.COMMENT_REPLY if payload.parent_id else NotificationType.NEW_COMMENT,
        title="New comment" if not payload.parent_id else "New reply",
        body=f"{user.full_name} commented on “{post.title}”.",
        data={"post_id": str(post.id)},
    )
    db.commit()
    db.refresh(comment)
    comment = db.scalar(
        select(Comment).options(selectinload(Comment.author).selectinload(User.skills)).where(Comment.id == comment.id)
    )
    assert comment is not None
    return CommentOut(
        id=comment.id,
        content=comment.content,
        created_at=comment.created_at,
        parent_id=comment.parent_id,
        author=to_public(comment.author),
    )


@router.post("/{post_id}/report", status_code=status.HTTP_201_CREATED)
def report_post(
    post_id: uuid.UUID,
    payload: ReportCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> dict[str, str]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    db.add(
        Report(
            reporter_id=user.id,
            target_type=ReportTargetType.POST,
            target_id=post_id,
            reason=payload.reason,
            details=payload.details,
        )
    )
    db.commit()
    return {"message": "Report submitted."}
