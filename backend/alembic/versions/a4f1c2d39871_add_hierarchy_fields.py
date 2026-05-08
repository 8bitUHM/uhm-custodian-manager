"""add hierarchy fields

Adds wing/org_code/position_id/uh_id on supervisors, group_number/position_id/uh_id
on j3, and j3_id (FK) + uh_id/position_id/position_title on custodians. Also
relaxes the email column on custodians to be nullable and non-unique, since the
roster used to seed real employees has no email column.

Revision ID: a4f1c2d39871
Revises: 7b6c3da95734
Create Date: 2026-05-07 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a4f1c2d39871"
down_revision: Union[str, None] = "7b6c3da95734"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- supervisors ---
    op.add_column("supervisors", sa.Column("wing", sa.String(length=20), nullable=True))
    op.add_column("supervisors", sa.Column("org_code", sa.String(length=20), nullable=True))
    op.add_column("supervisors", sa.Column("position_id", sa.String(length=50), nullable=True))
    op.add_column("supervisors", sa.Column("uh_id", sa.String(length=50), nullable=True))
    op.create_index("ix_supervisors_wing", "supervisors", ["wing"])
    op.create_index("ix_supervisors_org_code", "supervisors", ["org_code"])
    op.create_index("ix_supervisors_position_id", "supervisors", ["position_id"])
    op.create_index("ix_supervisors_uh_id", "supervisors", ["uh_id"])

    # --- j3 ---
    op.add_column("j3", sa.Column("group_number", sa.Integer(), nullable=True))
    op.add_column("j3", sa.Column("position_id", sa.String(length=50), nullable=True))
    op.add_column("j3", sa.Column("uh_id", sa.String(length=50), nullable=True))
    op.create_index("ix_j3_group_number", "j3", ["group_number"])
    op.create_index("ix_j3_position_id", "j3", ["position_id"])
    op.create_index("ix_j3_uh_id", "j3", ["uh_id"])

    # --- custodians ---
    op.add_column("custodians", sa.Column("uh_id", sa.String(length=50), nullable=True))
    op.add_column("custodians", sa.Column("position_id", sa.String(length=50), nullable=True))
    op.add_column(
        "custodians",
        sa.Column(
            "position_title",
            sa.String(length=50),
            nullable=True,
            server_default="Janitor II",
        ),
    )
    op.add_column("custodians", sa.Column("j3_id", sa.Integer(), nullable=True))
    op.create_index("ix_custodians_uh_id", "custodians", ["uh_id"])
    op.create_index("ix_custodians_position_id", "custodians", ["position_id"])
    op.create_foreign_key(
        "fk_custodians_j3_id_j3",
        "custodians",
        "j3",
        ["j3_id"],
        ["id"],
    )

    # Relax email: drop unique constraint + unique index, then allow NULL,
    # then re-add a non-unique index for lookups.
    op.execute("ALTER TABLE custodians DROP CONSTRAINT IF EXISTS custodians_email_key")
    op.execute("DROP INDEX IF EXISTS ix_custodians_email")
    op.alter_column("custodians", "email", existing_type=sa.String(length=255), nullable=True)
    op.create_index("ix_custodians_email", "custodians", ["email"], unique=False)


def downgrade() -> None:
    # --- custodians ---
    op.drop_index("ix_custodians_email", table_name="custodians")
    op.alter_column(
        "custodians", "email", existing_type=sa.String(length=255), nullable=False
    )
    op.create_index("ix_custodians_email", "custodians", ["email"], unique=True)

    op.drop_constraint("fk_custodians_j3_id_j3", "custodians", type_="foreignkey")
    op.drop_index("ix_custodians_position_id", table_name="custodians")
    op.drop_index("ix_custodians_uh_id", table_name="custodians")
    op.drop_column("custodians", "j3_id")
    op.drop_column("custodians", "position_title")
    op.drop_column("custodians", "position_id")
    op.drop_column("custodians", "uh_id")

    # --- j3 ---
    op.drop_index("ix_j3_uh_id", table_name="j3")
    op.drop_index("ix_j3_position_id", table_name="j3")
    op.drop_index("ix_j3_group_number", table_name="j3")
    op.drop_column("j3", "uh_id")
    op.drop_column("j3", "position_id")
    op.drop_column("j3", "group_number")

    # --- supervisors ---
    op.drop_index("ix_supervisors_uh_id", table_name="supervisors")
    op.drop_index("ix_supervisors_position_id", table_name="supervisors")
    op.drop_index("ix_supervisors_org_code", table_name="supervisors")
    op.drop_index("ix_supervisors_wing", table_name="supervisors")
    op.drop_column("supervisors", "uh_id")
    op.drop_column("supervisors", "position_id")
    op.drop_column("supervisors", "org_code")
    op.drop_column("supervisors", "wing")
