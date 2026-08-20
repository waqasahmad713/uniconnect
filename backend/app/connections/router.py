import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.auth.deps import get_current_verified_user
from app.auth.schemas import UserPublic
from app.core.enums import ConnectionStatus
from app.connections.models import Connection
from app.database.session import get_db
from app.users.models import User
from app.users.router import to_public

router = APIRouter(prefix="/api/connections", tags=["connections"])


class ConnectionOut(BaseModel):
    id: uuid.UUID
    status: ConnectionStatus
    requester: UserPublic
    addressee: UserPublic


def _pair_query(user_id: uuid.UUID, other_id: uuid.UUID):
    return select(Connection).where(
        or_(
            (Connection.requester_id == user_id) & (Connection.addressee_id == other_id),
            (Connection.requester_id == other_id) & (Connection.addressee_id == user_id),
        )
    )


def serialize(connection: Connection) -> ConnectionOut:
    return ConnectionOut(
        id=connection.id,
        status=connection.status,
        requester=to_public(connection.requester),
        addressee=to_public(connection.addressee),
    )


@router.post("/request", status_code=status.HTTP_201_CREATED)
def send_request(
    addressee_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> ConnectionOut:
    if addressee_id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot connect with yourself.")
    other = db.get(User, addressee_id)
    if other is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    existing = db.scalar(_pair_query(user.id, addressee_id))
    if existing and existing.status == ConnectionStatus.ACCEPTED:
        raise HTTPException(status.HTTP_409_CONFLICT, "You are already connected.")
    if existing and existing.status == ConnectionStatus.PENDING:
        raise HTTPException(status.HTTP_409_CONFLICT, "A request is already pending.")

    connection = Connection(
        requester_id=user.id,
        addressee_id=addressee_id,
        status=ConnectionStatus.PENDING,
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)
    connection = db.scalar(
        select(Connection)
        .options(
            selectinload(Connection.requester).selectinload(User.skills),
            selectinload(Connection.addressee).selectinload(User.skills),
        )
        .where(Connection.id == connection.id)
    )
    assert connection is not None
    return serialize(connection)


@router.post("/{connection_id}/accept")
def accept_request(
    connection_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> ConnectionOut:
    connection = db.get(Connection, connection_id)
    if connection is None or connection.addressee_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found.")
    connection.status = ConnectionStatus.ACCEPTED
    db.commit()
    db.refresh(connection)
    return serialize(connection)


@router.post("/{connection_id}/reject")
def reject_request(
    connection_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_verified_user)],
) -> ConnectionOut:
    connection = db.get(Connection, connection_id)
    if connection is None or connection.addressee_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found.")
    connection.status = ConnectionStatus.REJECTED
    db.commit()
    return serialize(connection)
