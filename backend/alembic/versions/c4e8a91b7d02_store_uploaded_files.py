"""store uploaded files

Revision ID: c4e8a91b7d02
Revises: a84956824073
Create Date: 2026-08-20 18:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4e8a91b7d02"
down_revision: Union[str, Sequence[str], None] = "a84956824073"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "stored_files",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=True),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("content_type", sa.String(length=80), nullable=False),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_stored_files_owner_id"), "stored_files", ["owner_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_stored_files_owner_id"), table_name="stored_files")
    op.drop_table("stored_files")
