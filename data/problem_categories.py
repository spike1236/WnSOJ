import sqlalchemy
from sqlalchemy import orm
from sqlalchemy_serializer import SerializerMixin
from .db_session import SqlAlchemyBase

problems_to_categories = sqlalchemy.Table('problems_to_categories', SqlAlchemyBase.metadata,
    sqlalchemy.Column('problems', sqlalchemy.Integer, sqlalchemy.ForeignKey('problems.id')),
    sqlalchemy.Column('categories', sqlalchemy.Integer, sqlalchemy.ForeignKey('categories.id')))


class Category(SqlAlchemyBase, SerializerMixin):
    __tablename__ = 'categories'
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    short_name = sqlalchemy.Column(sqlalchemy.String)
    long_name = sqlalchemy.Column(sqlalchemy.String)
    img_url = sqlalchemy.Column(sqlalchemy.String)
