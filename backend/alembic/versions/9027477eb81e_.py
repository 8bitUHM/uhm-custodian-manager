"""empty message

Revision ID: 9027477eb81e
Revises: 7b6c3da95734
Create Date: 2026-03-08 09:30:46.484808

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import Column, ForeignKey, Integer


# revision identifiers, used by Alembic.
revision: str = '9027477eb81e'
down_revision: Union[str, None] = '7b6c3da95734'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint('tasks_assigned_to_fkey', 'tasks')
    op.drop_column('tasks', 'assigned_to')
    op.add_column('tasks', Column('assigned_to', Integer, ForeignKey('j3.id')))


def downgrade() -> None:
    op.drop_constraint('tasks_assigned_to_fkey', 'tasks')
    op.drop_column('tasks', 'assigned_to')
    op.add_column('tasks', Column('assigned_to', Integer, ForeignKey('custodians.id')))
