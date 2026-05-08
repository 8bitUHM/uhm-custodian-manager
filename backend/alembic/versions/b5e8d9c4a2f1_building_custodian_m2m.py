"""building custodian many-to-many and public_slug

Revision ID: b5e8d9c4a2f1
Revises: a4f1c2d39871
Create Date: 2026-05-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "b5e8d9c4a2f1"
down_revision: Union[str, None] = "a4f1c2d39871"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)

    if "public_slug" not in [c["name"] for c in insp.get_columns("buildings")]:
        op.add_column(
            "buildings",
            sa.Column("public_slug", sa.String(length=100), nullable=True),
        )

    existing_ix = {ix["name"] for ix in insp.get_indexes("buildings")}
    if "ix_buildings_public_slug" not in existing_ix:
        op.create_index(
            "ix_buildings_public_slug", "buildings", ["public_slug"], unique=False
        )

    if not insp.has_table("custodian_building"):
        op.create_table(
            "custodian_building",
            sa.Column(
                "custodian_id",
                sa.Integer(),
                sa.ForeignKey("custodians.id", ondelete="CASCADE"),
                primary_key=True,
            ),
            sa.Column(
                "building_id",
                sa.Integer(),
                sa.ForeignKey("buildings.id", ondelete="CASCADE"),
                primary_key=True,
            ),
        )


def downgrade() -> None:
    op.drop_table("custodian_building")
    op.drop_index("ix_buildings_public_slug", table_name="buildings")
    op.drop_column("buildings", "public_slug")
