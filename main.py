from flask import Flask
from flask import render_template, redirect, abort, request
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from data import db_session
from data.users import User
import os


app = Flask(__name__)
app.config['SECRET_KEY'] = str(os.urandom(16))
login_manager = LoginManager()
login_manager.init_app()

db_session.global_init('db/main.sqlite')


@login_manager.user_loader
def load_user(user_id):
    session = db_session.create_session()
    return session.query(User).get(user_id)
