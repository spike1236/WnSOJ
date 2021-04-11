from PIL import Image
from flask import Flask
from flask import render_template, redirect, request, url_for
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
login_manager.init_app(app)

db_session.global_init('db/main.sqlite')


def page_params(navbar_item_id, title):
    d = dict()
    d['title'] = title + ' | WnSOJ'
    d['navbar_item_id'] = navbar_item_id
    if current_user.is_authenticated:
        d['link_to_profile'] = f'/profile/{current_user.id}'
        if current_user.icon_id == -1:
            d['icon64'] = url_for('static', filename=f'users_icons/icon64/default.png')
        else:
            d['icon64'] = url_for('static', filename=f'users_icons/icon64/icon64_user_{current_user.icon_id}.png')
    return d


@login_manager.user_loader
def load_user(user_id):
    session = db_session.create_session()
    return session.query(User).get(user_id)


ICON_POINTER = 1


# -------------------------------------------- REGISTER/LOGIN/LOGOUT START--------------------------------------------

@app.route('/register', methods=['GET', 'POST'])
def register():
    global ICON_POINTER
    db_sess = db_session.create_session()
    form = RegisterForm()
    params = page_params(-1, 'Registration')
    if form.validate_on_submit():
        if form.password.data != form.password_repeat.data:
            return render_template('register.html', **params, form=form, password_error_message="Passwords are not same")
        if db_sess.query(User).filter(User.username == form.username.data).first():
            return render_template('register.html', **params, form=form, username_error_message="User already exists")
        if db_sess.query(User).filter(User.email == form.email.data).first():
            return render_template('register.html', **params, form=form, email_error_message="User already exists")
        uname = form.username.data
        if len(uname) < 4:
            return render_template('register.html', **params, form=form, username_error_message="Username too short")
        if len(uname) >= 16:
            return render_template('register.html', **params, form=form, username_error_message="username too long")
        digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
        alphabet_u = [chr(i) for i in range(ord('A'), ord('Z') + 1)]
        alphabet_l = [chr(i) for i in range(ord('a'), ord('z') + 1)]
        for i in uname:
            if i not in digits and i not in alphabet_l and i not in alphabet_u:
                return render_template('register.html', **params, form=form,
                                       username_error_message="Username contains unallowed symbols")
        user = User(
            username=uname,
            fullname=form.fullname.data,
            email=form.email.data,
            account_type=form.is_business.data
        )
        icon_data = form.icon.data.read()
        if icon_data == b'':
            user.icon_id = -1
        else:
            user.icon_id = ICON_POINTER
            ICON_POINTER += 1
            icon64 = f'static/users_icons/icon64/icon64_user_{user.icon_id}.png'
            icon256 = f'static/users_icons/icon256/icon256_user_{user.icon_id}.png'
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
    return render_template('register.html', **params, form=form)


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    params = page_params(-1, 'Authorization')
    if form.validate_on_submit():
        db_sess = db_session.create_session()
        user = db_sess.query(User).filter(User.username == form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            return redirect("/")
        return render_template('login.html', **params,
                               message="Wrong username or password",
                               form=form)
    return render_template('login.html', **params, form=form)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect("/")

# -------------------------------------------- REGISTER/LOGIN/LOGOUT END--------------------------------------------


@app.route('/')
def abf10g9():
    return redirect('/home')


@app.route('/home')
def cad30f2():
    params = page_params(1, 'Home')
    params['card1'] = url_for('static', filename='img/main_page_card1.png')
    params['card2'] = url_for('static', filename='img/main_page_card2.png')
    params['card3'] = url_for('static', filename='img/main_page_card3.svg')
    return render_template('index.html', **params)


app.run()
