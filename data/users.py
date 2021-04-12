import sqlalchemy
from sqlalchemy import orm
from sqlalchemy_serializer import SerializerMixin
from .db_session import SqlAlchemyBase
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin


class User(SqlAlchemyBase, SerializerMixin, UserMixin):
    __tablename__ = 'users'
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    username = sqlalchemy.Column(sqlalchemy.String, unique=True)
    fullname = sqlalchemy.Column(sqlalchemy.String, nullable=True)
    email = sqlalchemy.Column(sqlalchemy.String, unique=True)
    hashed_password = sqlalchemy.Column(sqlalchemy.String)
    account_type = sqlalchemy.Column(sqlalchemy.Integer, nullable=True)
    icon_id = sqlalchemy.Column(sqlalchemy.Integer, nullable=True)
    phone_number = sqlalchemy.Column(sqlalchemy.String, nullable=True)
    jobs = orm.relation('Job', back_populates='user')
    submissions = orm.relation('Submission', back_populates='user')
    problems_solved = orm.relation("Problem",
                                   secondary="users_to_solved_problems",
                                   backref="users_solved")
    problems_unsolved = orm.relation("Problem",
                                     secondary="users_to_unsolved_problems",
                                     backref="users_unsolved")

    def set_password(self, password):
        self.hashed_password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.hashed_password, password)
