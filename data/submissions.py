import sqlalchemy
from sqlalchemy import orm
from sqlalchemy_serializer import SerializerMixin
from .db_session import SqlAlchemyBase
import datetime


class Submission(SqlAlchemyBase, SerializerMixin):
    __tablename__ = 'submissions'
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    verdict = sqlalchemy.Column(sqlalchemy.String)
    time = sqlalchemy.Column(sqlalchemy.Integer)
    memory = sqlalchemy.Column(sqlalchemy.Integer)
    language = sqlalchemy.Column(sqlalchemy.String)
    send_time = sqlalchemy.Column(sqlalchemy.String, default=datetime.datetime.now().strftime("%d/%b/%Y  %H:%M  UTC+6"))
    user_id = sqlalchemy.Column(sqlalchemy.Integer, sqlalchemy.ForeignKey("users.id"))
    problem_id = sqlalchemy.Column(sqlalchemy.Integer, sqlalchemy.ForeignKey("problems.id"))
    user = orm.relation("User")
    problem = orm.relation("Problem")
