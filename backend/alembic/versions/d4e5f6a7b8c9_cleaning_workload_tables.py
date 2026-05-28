"""cleaning workload tables

Revision ID: d4e5f6a7b8c9
Revises: c3b4d5e6f7a8
Create Date: 2026-05-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3b4d5e6f7a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cleaning_space_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("minutes_per_unit", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_cleaning_space_types_slug", "cleaning_space_types", ["slug"])

    op.create_table(
        "cleaning_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("workday_minutes", sa.Integer(), nullable=False, server_default="480"),
        sa.Column("sqft_preference", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "aim_property_mappings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_code", sa.Integer(), nullable=False),
        sa.Column("building_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["building_id"], ["buildings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("property_code"),
    )
    op.create_index(
        "ix_aim_property_mappings_property_code",
        "aim_property_mappings",
        ["property_code"],
    )

    op.create_table(
        "space_type_mappings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cleaning_space_type_id", sa.Integer(), nullable=False),
        sa.Column("match_field", sa.String(length=30), nullable=False),
        sa.Column("match_kind", sa.String(length=20), nullable=False),
        sa.Column("match_value", sa.String(length=200), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(
            ["cleaning_space_type_id"],
            ["cleaning_space_types.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "building_spaces",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("building_id", sa.Integer(), nullable=False),
        sa.Column("location_code", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("primary_type", sa.String(length=50), nullable=True),
        sa.Column("location_type_group", sa.String(length=50), nullable=True),
        sa.Column("user_sqft", sa.Numeric(12, 2), nullable=True),
        sa.Column("cad_gross", sa.Numeric(12, 2), nullable=True),
        sa.Column("polyline_sqft", sa.Numeric(12, 2), nullable=True),
        sa.Column("effective_sqft", sa.Numeric(12, 2), nullable=True),
        sa.Column("cleaning_space_type_id", sa.Integer(), nullable=True),
        sa.Column("cleaning_minutes", sa.Float(), nullable=False, server_default="0"),
        sa.Column("source_property_code", sa.Integer(), nullable=True),
        sa.Column("import_batch_id", sa.String(length=36), nullable=False),
        sa.Column("imported_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["building_id"], ["buildings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["cleaning_space_type_id"],
            ["cleaning_space_types.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "building_id",
            "location_code",
            "import_batch_id",
            name="uq_building_space_location_batch",
        ),
    )
    op.create_index("ix_building_spaces_building_id", "building_spaces", ["building_id"])
    op.create_index(
        "ix_building_spaces_import_batch_id", "building_spaces", ["import_batch_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_building_spaces_import_batch_id", table_name="building_spaces")
    op.drop_index("ix_building_spaces_building_id", table_name="building_spaces")
    op.drop_table("building_spaces")
    op.drop_table("space_type_mappings")
    op.drop_index("ix_aim_property_mappings_property_code", table_name="aim_property_mappings")
    op.drop_table("aim_property_mappings")
    op.drop_table("cleaning_settings")
    op.drop_index("ix_cleaning_space_types_slug", table_name="cleaning_space_types")
    op.drop_table("cleaning_space_types")
