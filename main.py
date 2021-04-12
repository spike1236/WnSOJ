from PIL import Image
from flask import Flask
from flask import render_template, redirect, request, url_for, abort
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from data import db_session
from data.users import User
from data.problems import Problem
from data.submissions import Submission
from data.jobs import Job
from forms.register_form import RegisterForm
from forms.login_form import LoginForm
from forms.submit_form import SubmitForm
from random import randrange
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


@app.errorhandler(404)
def error_404(error):
    params = page_params(-1, 'Error 404')
    return render_template('404.html', **params)


@app.errorhandler(403)
def error_403(error):
    params = page_params(-1, 'Error 403')
    return render_template('403.html', **params)


@app.errorhandler(500)
def error_500(error):
    params = page_params(-1, 'Error 500')
    return render_template('500.html', **params)


@app.errorhandler(401)
def error_401(error):
    params = page_params(-1, 'Error 401')
    return render_template('401.html', **params)


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


def check_phone_number(n: str):
    er = 'error'
    if n.count('+') > 1:
        return er
    if len(n) == 1:
        return er
    if n[0] == '+' and n[1] != '7':
        return er
    if n[0] != '8' and n[0] != '+':
        return er
    if n[0] == '-' or n[-1] == '-':
        return er
    ans = '+7'
    cnt = 0
    for i in range(1 + (n[0] == '+' and n[1] == '7'), len(n)):
        if n[i].isdigit():
            ans += n[i]
        if n[i] == '-':
            if i + 1 < len(n) and n[i + 1] == '-':
                return er
        if n[i] == ')':
            cnt -= 1
        elif n[i] == '(':
            cnt += 1
        if cnt != 1 and cnt != 0:
            return er

    if cnt != 0:
        return er
    if len(ans) != 12:
        return er
    else:
        return ans


# -------------------------------------------- REGISTER/LOGIN/LOGOUT START--------------------------------------------

@app.route('/register', methods=['GET', 'POST'])
def register():
    db_sess = db_session.create_session()
    form = RegisterForm()
    params = page_params(-1, 'Registration')
    if form.validate_on_submit():
        if form.password.data != form.password_repeat.data:
            return render_template('register.html', **params, form=form,
                                   password_error_message="Passwords are not same")
        if db_sess.query(User).filter(User.username == form.username.data).first():
            return render_template('register.html', **params, form=form, username_error_message="User already exists")
        if db_sess.query(User).filter(User.email == form.email.data).first():
            return render_template('register.html', **params, form=form, email_error_message="User already exists")
        uname = form.username.data
        if not uname.isalnum():
            return render_template('register.html', **params, form=form,
                                   username_error_message="Username contains unallowed symbols")
        if uname.isdecimal():
            return render_template('register.html', **params,
                                   form=form, username_error_message='Username must contain at least 1 latin letter')
        if form.phone_number.data and check_phone_number(form.phone_number.data) == 'error':
            return render_template('register.html', **params,
                                   form=form, phone_number_error_message='Invalid phone number')
        user = User(
            username=uname,
            fullname=form.fullname.data,
            email=form.email.data,
            account_type=form.is_business.data,
            phone_number=form.phone_number.data
        )
        icon_data = form.icon.data.read()
        if icon_data == b'':
            user.icon_id = -1
        else:
            icon_id = randrange(10000000, 100000000)
            while True:
                if f'static/users_icons/icon64/icon64_user_{icon_id}.png' in os.listdir('static/users_icons/icon64/'):
                    icon_id = randrange(10000000, 100000000)
                else:
                    break
            user.icon_id = icon_id
            icon64 = f'static/users_icons/icon64/icon64_user_{user.icon_id}.png'
            icon256 = f'static/users_icons/icon256/icon256_user_{user.icon_id}.png'
            with open(icon64, 'wb') as file:
                file.write(icon_data)
                resize_image(icon64, (64, 64))

            with open(icon256, 'wb') as file:
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
    params['card1'] = url_for('static', filename='img/main_page_card1.svg')
    params['card2'] = url_for('static', filename='img/main_page_card2.svg')
    params['card3'] = url_for('static', filename='img/main_page_card3.svg')
    return render_template('index.html', **params)


@app.route('/contests')
def ad871fe():
    params = page_params(4, 'Contests')
    return render_template('contests.html', **params)


@app.route('/profile/<username>')
def fa908cb(username):
    if username.isdecimal():
        username = int(username)
        session = db_session.create_session()
        user = session.query(User).filter(User.id == username).first()
        if user:
            return redirect(f'/profile/{user.username}')
        else:
            abort(404)
    session = db_session.create_session()
    user = session.query(User).filter(User.username == username).first()
    if user:
        params = page_params(-1, f"{user.username}'s profile")
        params['icon_256'] = url_for('static', filename=f'users_icons/icon256/icon256_user_{user.icon_id}.png')
        params['user'] = user
        return render_template('profile.html', **params)
    else:
        abort(404)


@app.route('/problems')
def a1bo2ba():
    with open('data/PROBLEMS_CATEGORIES') as file:
        a = file.readlines()[1].strip().split(',')
        b = []
        for i in a:
            b.append([i, i.lower().replace(' ', '_')])
        params = page_params(2, 'Problems')
        params['categories'] = b
        return render_template('problems_list.html', **params, show_categories=1)


@app.route('/problems/<category>')
def a098bfo(category):
    username = request.args.get('author')
    session = db_session.create_session()
    if username is None:
        if category == 'problemset':
            problems = session.query(Problem).all()
            return render_template('problem_list.html')
        else:
            pass
    else:
        pass
    return render_template('base.html')


app.run()
