"""Added short info field to jobs

Revision ID: e04b40b53198
Revises: 4e1bed22123d
Create Date: 2024-09-16 22:52:24.152804

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e04b40b53198'
down_revision: Union[str, None] = '4e1bed22123d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('jobs', sa.Column('short_info', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('jobs', 'short_info')
    # ### end Alembic commands ###
