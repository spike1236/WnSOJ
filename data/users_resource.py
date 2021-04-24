from flask import jsonify
from flask_restful import abort, Resource
from data import db_session
from data.users import User


def abort_if_user_not_found(user_id):
    session = db_session.create_session()
    if not session.query(User).get(user_id):
        abort(404, message=f"User {user_id} not found")


class UserResource(Resource):
    def get(self, user_id):
        abort_if_user_not_found(user_id)
        session = db_session.create_session()
        user = session.query(User).filter(User.id == user_id).first()
        return jsonify({'user': user.to_dict(only=('username', 'fullname', 'email', 'phone_number'))})


class UsersListResource(Resource):
    def get(self):
        session = db_session.create_session()
        users = session.query(User).all()
        return jsonify({'users': [item.to_dict(only=('username', 'fullname', 'email', 'phone_number'))
                                  for item in users]})
