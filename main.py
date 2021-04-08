from PIL import Image
from flask import Flask
from flask import render_template, redirect, request
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from data import db_session
from data.users import User
from data.problems import Problem
from data.submissions import Submission
from data.jobs import Job
from forms.register_form import RegisterForm
from forms.login_form import LoginForm
from forms.submit import SubmitForm
import os


def resize_image(file, size):
    im = Image.open(file)
    im = im.resize(size)
    im.save(file)


app = Flask(__name__)
app.config['SECRET_KEY'] = str(os.urandom(16))
login_manager = LoginManager()
login_manager.init_app()

db_session.global_init('db/main.sqlite')


@login_manager.user_loader
def load_user(user_id):
    session = db_session.create_session()
    return session.query(User).get(user_id)


# -------------------------------------------- REGISTER/LOGIN/LOGOUT START--------------------------------------------

@app.route('/register', methods=['GET', 'POST'])
def register():
    db_sess = db_session.create_session()
    form = RegisterForm()
    if form.validate_on_submit():
        if form.password.data != form.password_again.data:
            return render_template('register.html', title='Registration',
                                   form=form,
                                   message="Passwords are not same")
        if db_sess.query(User).filter(User.username == form.username.data).first():
            return render_template('register.html', title='Registration',
                                   form=form,
                                   message="User already exists")
        if db_sess.query(User).filter(User.email == form.email.data).first():
            return render_template('register.html', title='Registration',
                                   form=form,
                                   message="User already exists")
        uname = form.username.data
        if len(uname) < 4:
            return render_template('register.html', title='Registration',
                                   form=form,
                                   message="Nickname too short")
        if len(uname) >= 16:
            return render_template('register.html', title='Registration',
                                   form=form,
                                   message="Nickname too long")
        digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
        alphabet_u = [chr(i) for i in range(ord('A'), ord('Z') + 1)]
        alphabet_l = [chr(i) for i in range(ord('a'), ord('z') + 1)]
        for i in uname:
            if i not in digits and i not in alphabet_l and i not in alphabet_u:
                return render_template('register.html', title='Registration',
                                       form=form,
                                       message="Nickname contains unallowed symbols")
        user = User(
            username=uname,
            surname=form.surname.data,
            email=form.email.data,
            name=form.name.data,
            account_type=form.is_business.data
        )
        icon_data = form.icon.data.read()
        if icon_data == b'':
            user.icon_id = -1
        else:
            user.icon_id = user.id
            icon64 = f'static/users_icons/icon64/icon64_user_{user.id}.png'
            icon256 = f'static/users_icons/icon256/icon256_user_{user.id}.png'
            with open(icon64, 'rb') as file:
                file.write(icon_data)
                resize_image(icon64, (64, 64))

            with open(icon256, 'rb') as file:
                file.write(icon_data)
                resize_image(icon256, (256, 256))

        user.set_password(form.password.data)
        db_sess.add(user)
        db_sess.commit()
        return redirect('/login')
    return render_template('register.html', title='Registration', form=form)


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        db_sess = db_session.create_session()
        user = db_sess.query(User).filter(User.username == form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            return redirect("/")
        return render_template('login.html',
                               message="Wrong username or password",
                               form=form)
    return render_template('login.html', title='Authorization', form=form)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect("/")

# -------------------------------------------- REGISTER/LOGIN/LOGOUT END--------------------------------------------


app.run()
