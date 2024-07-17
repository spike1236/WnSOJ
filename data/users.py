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
    jobs = orm.relationship('Job', back_populates='user')
    submissions = orm.relationship('Submission', back_populates='user')
    problems_solved = orm.relationship("Problem",
                                   secondary="users_to_solved_problems",
                                   backref="users_solved", lazy='subquery')
    problems_unsolved = orm.relationship("Problem",
                                     secondary="users_to_unsolved_problems",
                                     backref="users_unsolved", lazy='subquery')

    def set_password(self, password):
        self.hashed_password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.hashed_password, password)
