import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auth.deps import get_current_admin
from app.core.enums import ReportStatus, ReportTargetType, utc_now
from app.database.session import get_db
from app.events.models import Event
from app.opportunities.models import Opportunity
from app.posts.models import Comment, Post
from app.reports.models import AdminAuditLog, Report
from app.users.models import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _audit(db: Session, admin: User, action: str, target_type: str, target_id: str) -> None:
    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action=action,
            target_type=target_type,
            target_id=target_id,
        )
    )


@router.get("/stats")
def stats(
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> dict[str, int]:
    return {
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "posts": db.scalar(select(func.count()).select_from(Post).where(Post.is_removed.is_(False)))
        or 0,
        "comments": db.scalar(
            select(func.count()).select_from(Comment).where(Comment.is_removed.is_(False))
        )
        or 0,
        "opportunities": db.scalar(
            select(func.count()).select_from(Opportunity).where(Opportunity.is_removed.is_(False))
        )
        or 0,
        "events": db.scalar(select(func.count()).select_from(Event).where(Event.is_removed.is_(False)))
        or 0,
        "pending_reports": db.scalar(
            select(func.count()).select_from(Report).where(Report.status == ReportStatus.PENDING)
        )
        or 0,
    }


@router.get("/users")
def list_users(
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> list[dict]:
    users = db.scalars(select(User).order_by(User.created_at.desc()).limit(200)).all()
    return [
        {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "university": user.university,
            "department": user.department,
            "role": user.role,
            "email_verified": user.email_verified,
            "is_admin": user.is_admin,
            "is_suspended": user.is_suspended,
            "affiliation_verified": user.affiliation_verified,
            "created_at": user.created_at.isoformat(),
        }
        for user in users
    ]


@router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> dict[str, str]:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot suspend your own account.")
    user.is_suspended = True
    user.token_version += 1
    _audit(db, admin, "suspend_user", "user", str(user.id))
    db.commit()
    return {"message": "User suspended."}


@router.post("/users/{user_id}/unsuspend")
def unsuspend_user(
    user_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> dict[str, str]:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    user.is_suspended = False
    _audit(db, admin, "unsuspend_user", "user", str(user.id))
    db.commit()
    return {"message": "User restored."}


@router.post("/users/{user_id}/verify-affiliation")
def verify_affiliation(
    user_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> dict[str, str]:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    user.affiliation_verified = True
    _audit(db, admin, "verify_affiliation", "user", str(user.id))
    db.commit()
    return {"message": "Affiliation verified."}


@router.get("/posts")
def list_posts(
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> list[dict]:
    posts = db.scalars(
        select(Post)
        .options(selectinload(Post.author), selectinload(Post.tags))
        .order_by(Post.created_at.desc())
        .limit(200)
    ).all()
    return [
        {
            "id": str(post.id),
            "title": post.title,
            "content": post.content,
            "post_type": post.post_type,
            "tags": [tag.name for tag in post.tags],
            "is_featured": post.is_featured,
            "is_removed": post.is_removed,
            "created_at": post.created_at.isoformat(),
            "author_name": post.author.full_name,
            "author_username": post.author.username,
        }
        for post in posts
    ]


@router.post("/posts/{post_id}/feature")
def toggle_feature(
    post_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> dict[str, bool]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    post.is_featured = not post.is_featured
    _audit(db, admin, "feature_post" if post.is_featured else "unfeature_post", "post", str(post.id))
    db.commit()
    return {"is_featured": post.is_featured}


@router.post("/posts/{post_id}/remove")
def remove_post(
    post_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> dict[str, str]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    post.is_removed = True
    _audit(db, admin, "remove_post", "post", str(post.id))
    db.commit()
    return {"message": "Post removed."}


@router.post("/posts/{post_id}/restore")
def restore_post(
    post_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> dict[str, str]:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found.")
    post.is_removed = False
    _audit(db, admin, "restore_post", "post", str(post.id))
    db.commit()
    return {"message": "Post restored."}


@router.get("/reports")
def list_reports(
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> list[dict]:
    reports = db.scalars(select(Report).order_by(Report.created_at.desc()).limit(100)).all()
    return [
        {
            "id": str(report.id),
            "target_type": report.target_type,
            "target_id": str(report.target_id),
            "reason": report.reason,
            "status": report.status,
            "details": report.details,
            "created_at": report.created_at.isoformat(),
        }
        for report in reports
    ]


@router.post("/reports/{report_id}/dismiss")
def dismiss_report(
    report_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> dict[str, str]:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found.")
    report.status = ReportStatus.DISMISSED
    report.reviewed_at = utc_now()
    report.reviewed_by_id = admin.id
    _audit(db, admin, "dismiss_report", "report", str(report.id))
    db.commit()
    return {"message": "Report dismissed."}


@router.post("/reports/{report_id}/action")
def action_report(
    report_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> dict[str, str]:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found.")
    if report.target_type == ReportTargetType.POST:
        post = db.get(Post, report.target_id)
        if post:
            post.is_removed = True
    elif report.target_type == ReportTargetType.COMMENT:
        comment = db.get(Comment, report.target_id)
        if comment:
            comment.is_removed = True
    elif report.target_type == ReportTargetType.USER:
        user = db.get(User, report.target_id)
        if user and user.id != admin.id:
            user.is_suspended = True
            user.token_version += 1
    report.status = ReportStatus.ACTIONED
    report.reviewed_at = utc_now()
    report.reviewed_by_id = admin.id
    _audit(db, admin, "action_report", "report", str(report.id))
    db.commit()
    return {"message": "Report actioned."}
