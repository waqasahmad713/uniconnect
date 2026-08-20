import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import OpportunityType, WorkMode, utc_now
from app.database.session import Base
from app.users.models import User


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    author_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    organization: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    opportunity_type: Mapped[OpportunityType] = mapped_column(String(30), index=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    work_mode: Mapped[WorkMode] = mapped_column(String(20), default=WorkMode.ONSITE)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    application_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    contact: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_removed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    author: Mapped[User] = relationship()
    skills: Mapped[list["OpportunitySkill"]] = relationship(
        back_populates="opportunity", cascade="all, delete-orphan"
    )


class OpportunitySkill(Base):
    __tablename__ = "opportunity_skills"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("opportunities.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(80))

    opportunity: Mapped[Opportunity] = relationship(back_populates="skills")

    __table_args__ = (
        UniqueConstraint(
            "opportunity_id", "name", name="uq_opportunity_skills_name"
        ),
    )
