import uuid
from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.auth.deps import get_current_admin
from app.core.enums import OpportunityType, WorkMode
from app.database.session import get_db
from app.opportunities.models import Opportunity, OpportunitySkill
from app.users.models import User

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


class OpportunityCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    organization: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=10)
    opportunity_type: OpportunityType
    location: str | None = None
    work_mode: WorkMode = WorkMode.ONSITE
    deadline: date | None = None
    application_url: str | None = None
    contact: str | None = None
    skills: list[str] = []


class OpportunityOut(BaseModel):
    id: uuid.UUID
    title: str
    organization: str
    description: str
    opportunity_type: OpportunityType
    location: str | None
    work_mode: WorkMode
    deadline: date | None
    application_url: str | None
    contact: str | None
    skills: list[str]
    created_at: datetime
    author_username: str
    author_name: str


def serialize(item: Opportunity) -> OpportunityOut:
    return OpportunityOut(
        id=item.id,
        title=item.title,
        organization=item.organization,
        description=item.description,
        opportunity_type=item.opportunity_type,
        location=item.location,
        work_mode=item.work_mode,
        deadline=item.deadline,
        application_url=item.application_url,
        contact=item.contact,
        skills=[skill.name for skill in item.skills],
        created_at=item.created_at,
        author_username=item.author.username,
        author_name=item.author.full_name,
    )


@router.get("")
def list_opportunities(
    db: Annotated[Session, Depends(get_db)],
    q: str | None = None,
    opportunity_type: str | None = None,
) -> list[OpportunityOut]:
    query = (
        select(Opportunity)
        .options(selectinload(Opportunity.skills), selectinload(Opportunity.author))
        .where(Opportunity.is_removed.is_(False))
    )
    if q:
        like = f"%{q}%"
        query = query.where(
            or_(
                Opportunity.title.ilike(like),
                Opportunity.description.ilike(like),
                Opportunity.organization.ilike(like),
            )
        )
    if opportunity_type:
        query = query.where(Opportunity.opportunity_type == opportunity_type)
    items = db.scalars(query.order_by(Opportunity.created_at.desc()).limit(50)).all()
    return [serialize(item) for item in items]


@router.get("/{opportunity_id}")
def read_opportunity(
    opportunity_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> OpportunityOut:
    item = db.scalar(
        select(Opportunity)
        .options(selectinload(Opportunity.skills), selectinload(Opportunity.author))
        .where(Opportunity.id == opportunity_id, Opportunity.is_removed.is_(False))
    )
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not found.")
    return serialize(item)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_opportunity(
    payload: OpportunityCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_admin)],
) -> OpportunityOut:
    item = Opportunity(
        author_id=user.id,
        title=payload.title,
        organization=payload.organization,
        description=payload.description,
        opportunity_type=payload.opportunity_type,
        location=payload.location,
        work_mode=payload.work_mode,
        deadline=payload.deadline,
        application_url=payload.application_url,
        contact=payload.contact,
        skills=[OpportunitySkill(name=name.strip()) for name in payload.skills if name.strip()],
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    item = db.scalar(
        select(Opportunity)
        .options(selectinload(Opportunity.skills), selectinload(Opportunity.author))
        .where(Opportunity.id == item.id)
    )
    assert item is not None
    return serialize(item)


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(
    opportunity_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_current_admin)],
) -> None:
    item = db.get(Opportunity, opportunity_id)
    if item is None or item.is_removed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not found.")
    item.is_removed = True
    db.commit()
