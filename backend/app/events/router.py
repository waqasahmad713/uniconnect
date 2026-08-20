import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth.deps import get_current_admin
from app.database.session import get_db
from app.events.models import Event
from app.users.models import User

router = APIRouter(prefix="/api/events", tags=["events"])


class EventCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    starts_at: datetime
    ends_at: datetime | None = None
    location: str | None = None
    is_online: bool = False
    registration_url: str | None = None
    image_url: str | None = None


class EventOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    starts_at: datetime
    ends_at: datetime | None
    location: str | None
    is_online: bool
    registration_url: str | None
    image_url: str | None
    organizer_name: str
    organizer_username: str


def serialize(event: Event) -> EventOut:
    return EventOut(
        id=event.id,
        title=event.title,
        description=event.description,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        location=event.location,
        is_online=event.is_online,
        registration_url=event.registration_url,
        image_url=event.image_url,
        organizer_name=event.organizer.full_name,
        organizer_username=event.organizer.username,
    )


@router.get("")
def list_events(db: Annotated[Session, Depends(get_db)]) -> list[EventOut]:
    events = db.scalars(
        select(Event)
        .options(selectinload(Event.organizer))
        .where(Event.is_removed.is_(False))
        .order_by(Event.starts_at.asc())
        .limit(50)
    ).all()
    return [serialize(event) for event in events]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_admin)],
) -> EventOut:
    event = Event(organizer_id=user.id, **payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    event = db.scalar(
        select(Event).options(selectinload(Event.organizer)).where(Event.id == event.id)
    )
    assert event is not None
    return serialize(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> None:
    event = db.get(Event, event_id)
    if event is None or event.is_removed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found.")
    event.is_removed = True
    db.commit()
