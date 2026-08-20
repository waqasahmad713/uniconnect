from uuid import UUID

from sqlalchemy.orm import Session

from app.core.enums import NotificationType
from app.notifications.models import Notification


def notify(
    db: Session,
    *,
    user_id: UUID,
    actor_id: UUID,
    type: NotificationType,
    title: str,
    body: str,
    data: dict | None = None,
) -> None:
    if user_id == actor_id:
        return
    db.add(
        Notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            data=data,
        )
    )
