"""empty message

Revision ID: e9974de096a8
Revises: 61a09d0460a6
Create Date: 2026-03-22 16:01:10.473921

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9974de096a8'
down_revision: Union[str, None] = '61a09d0460a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
