from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.deps import get_current_verified_user
from app.database.session import get_db
from app.notifications.models import Notification
from app.users.models import User

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> list[dict]:
    notes = db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    ).all()
    return [
        {
            "id": str(note.id),
            "type": note.type,
            "title": note.title,
            "body": note.body,
            "is_read": note.is_read,
            "created_at": note.created_at.isoformat(),
        }
        for note in notes
    ]
