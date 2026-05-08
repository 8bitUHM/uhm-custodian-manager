"""building partitions and rotation anchors

Revision ID: c3b4d5e6f7a8
Revises: b5e8d9c4a2f1
Create Date: 2026-05-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3b4d5e6f7a8"
down_revision: Union[str, None] = "b5e8d9c4a2f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "building_partitions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("building_id", sa.Integer(), nullable=False),
        sa.Column("floor_id", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("geometry", sa.Text(), nullable=False),
        sa.Column("fill_color", sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(["building_id"], ["buildings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_building_partitions_building_id",
        "building_partitions",
        ["building_id"],
        unique=False,
    )
    op.create_index(
        "ix_building_partitions_floor_id",
        "building_partitions",
        ["floor_id"],
        unique=False,
    )

    op.create_table(
        "building_partition_rotations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("building_id", sa.Integer(), nullable=False),
        sa.Column("j3_id", sa.Integer(), nullable=False),
        sa.Column("anchor_date", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["building_id"], ["buildings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["j3_id"], ["j3.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "building_id",
            "j3_id",
            name="uq_partition_rotation_building_j3",
        ),
    )
    op.create_index(
        "ix_building_partition_rotations_building_id",
        "building_partition_rotations",
        ["building_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_building_partition_rotations_building_id",
        table_name="building_partition_rotations",
    )
    op.drop_table("building_partition_rotations")
    op.drop_index("ix_building_partitions_floor_id", table_name="building_partitions")
    op.drop_index("ix_building_partitions_building_id", table_name="building_partitions")
    op.drop_table("building_partitions")
