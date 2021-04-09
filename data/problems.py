import sqlalchemy
from sqlalchemy import orm
from .db_session import SqlAlchemyBase


class Problem(SqlAlchemyBase):
    __tablename__ = 'problems'
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    title = sqlalchemy.Column(sqlalchemy.String)
    time_limit = sqlalchemy.Column(sqlalchemy.Float)
    memory_limit = sqlalchemy.Column(sqlalchemy.Integer)
    theme = sqlalchemy.Column(sqlalchemy.String)
    user_id = sqlalchemy.Column(sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id"))
    user = orm.relation('User')
    submissions = orm.relation('Submission', back_populates='problem')
