from PIL import UnidentifiedImageError
from PIL import Image
from flask import Flask
from flask import render_template, redirect, request, url_for, abort
from flask_restful import Api
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from data import db_session
from data.users import User
from data.problems import Problem
from data.submissions import Submission
from data.jobs import Job
from forms.register_form import RegisterForm
from forms.login_form import LoginForm
from forms.submit_form import SubmitForm
from forms.add_problem_form import AddProblemForm
from forms.add_job_form import AddJobForm
from forms.change_icon_form import ChangeIconForm
from forms.change_password_form import ChangePasswordForm
from data import users_resource
from data import problems_resource
from data import submissions_resource
from data import jobs_resource
from random import randrange
import os
import json
import multiprocessing
from sqlalchemy import func as sqlalchemy_func
from tester import test_forever
from zipfile import ZipFile
from io import BytesIO


# import logging
# import sys
#
#
# logging.basicConfig(filename='server_log.log', format='%(asctime)s %(levelname)s %(name)s %(message)s')

app = Flask(__name__)
app.config['SECRET_KEY'] = str(os.urandom(16))

login_manager = LoginManager()
login_manager.init_app(app)

api = Api(app)
api.add_resource(users_resource.UsersListResource, '/api/v1/users')
api.add_resource(users_resource.UserResource, '/api/v1/user/<int:user_id>')

api.add_resource(problems_resource.ProblemsListResource, '/api/v1/problems')
api.add_resource(problems_resource.ProblemResource, '/api/v1/problem/<int:problem_id>')

api.add_resource(submissions_resource.SubmissionsListResource, '/api/v1/submissions')
api.add_resource(submissions_resource.SubmissionResource, '/api/v1/submission/<int:submission_id>')

api.add_resource(jobs_resource.JobsListResource, '/api/v1/jobs')
api.add_resource(jobs_resource.JobResource, '/api/v1/job/<int:job_id>')


db_session.global_init('db/main.sqlite')


def main():
    processes = []
    process = multiprocessing.Process(target=test_forever)
    processes.append(process)
    process.start()
    del process
    process = multiprocessing.Process(target=app.run(host='127.0.0.1', port='5000'))
    processes.append(process)
    process.start()
    del process
    for process in processes:
        process.join()


def resize_image(file, size):
    im = Image.open(file)
    im = im.resize(size)
    im.save(file)


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


def page_params(navbar_item_id, title):
    d = dict()
    d['title'] = title + ' | WnSOJ'
    d['navbar_item_id'] = navbar_item_id
    if current_user.is_authenticated:
        d['link_to_profile'] = f'/profile/{current_user.username}'
        if current_user.icon_id == -1:
            d['icon64'] = url_for('static', filename=f'users_icons/icon64/default.png')
        else:
            d['icon64'] = url_for('static', filename=f'users_icons/icon64/icon64_user_{current_user.icon_id}.png')
    return d


@app.errorhandler(404)
def error_404(error):
    params = page_params(-1, 'Error 404')
    return render_template('404.html', **params), 404


@app.errorhandler(403)
def error_403(error):
    params = page_params(-1, 'Error 403')
    return render_template('403.html', **params), 403


@app.errorhandler(500)
def error_500(error):
    params = page_params(-1, 'Error 500')
    return render_template('500.html', **params), 500


@app.errorhandler(401)
def error_401(error):
    params = page_params(-1, 'Error 401')
    return render_template('401.html', **params), 401


# remove cache
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, public, max-age=0"
    response.headers["Expires"] = '0'
    response.headers["Pragma"] = "no-cache"
    return response


@login_manager.user_loader
def load_user(user_id):
    session = db_session.create_session()
    return session.query(User).get(user_id)


# -------------------------------------------- REGISTER/LOGIN/LOGOUT START--------------------------------------------

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect('/')
    db_sess = db_session.create_session()
    form = RegisterForm()
    params = page_params(-1, 'Registration')
    if form.validate_on_submit():
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
        if form.password.data != form.password_repeat.data:
            return render_template('register.html', **params, form=form,
                                   password_error_message="Passwords are not same")
        if len(form.password.data) < 8:
            return render_template('register.html', **params, form=form,
                                   password_error_message="Password is too short")
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
            icon170 = f'static/users_icons/icon170/icon170_user_{user.icon_id}.png'
            try:
                with open(icon64, 'wb') as file:
                    file.write(icon_data)
                    resize_image(icon64, (64, 64))
            except UnidentifiedImageError:
                os.remove(icon64)
                return render_template('register.html', **params,
                                       form=form, message='Cannot identify image file')
            try:
                with open(icon170, 'wb') as file:
                    file.write(icon_data)
                    resize_image(icon170, (170, 170))
            except UnidentifiedImageError:
                os.remove(icon170)
                return render_template('register.html', **params,
                                       form=form, message='Cannot identify image file')
        user.set_password(form.password.data)
        db_sess.add(user)
        db_sess.commit()
        return redirect('/login')
    return render_template('register.html', **params, form=form)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect('/')
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
def home_page_redirect():
    return redirect('/home')


@app.route('/home')
def home_page():
    params = page_params(1, 'Home')
    params['card1'] = url_for('static', filename='img/main_page_card1.svg')
    params['card2'] = url_for('static', filename='img/main_page_card2.svg')
    params['card3'] = url_for('static', filename='img/main_page_card3.svg')
    return render_template('index.html', **params)


@app.route('/faq')
def faq_page():
    params = page_params(4, 'FAQ')
    return render_template('faq.html', **params)


@app.route('/profile/<username>')
def profile_page(username):
    session = db_session.create_session()
    user = session.query(User).filter(User.username == username).first()
    if user:
        params = page_params(-1, f"{user.username}'s profile")
        if user.icon_id != -1:
            params['icon_170'] = url_for('static', filename=f'users_icons/icon170/icon170_user_{user.icon_id}.png')
        else:
            params['icon_170'] = url_for('static', filename='users_icons/icon170/default.png')
        params['user'] = user
        params['submissions'] = session.query(Submission).filter(Submission.user_id == user.id).all()
        params['submissions'].reverse()
        params['cnt'] = {
            'AC': 0,
            'CE': 0,
            'WA': 0,
            'TLE': 0,
            'MLE': 0,
            'RE': 0
        }
        for i in params['submissions']:
            if i.verdict == 'In queue':
                continue
            if i.verdict == 'AC':
                params['cnt']['AC'] += 1
            else:
                ver = i.verdict.split()
                params['cnt'][ver[0]] += 1
        if len(params['submissions']) > 10:
            params['submissions'] = params['submissions'][:10:]
        return render_template('profile.html', **params)
    else:
        abort(404)


@app.route('/edit_profile', methods=['GET', 'POST'])
@login_required
def edit_profile_page():
    session = db_session.create_session()
    params = page_params(-1, 'Edit Profile')
    change_password_form = ChangePasswordForm()
    change_icon_form = ChangeIconForm()
    params['change_password_form'] = change_password_form
    params['change_icon_form'] = change_icon_form
    user = session.query(User).get(current_user.id)
    if current_user.icon_id == -1:
        params['profile_icon'] = f'static/users_icons/icon170/default.png'
    else:
        params['profile_icon'] = f'static/users_icons/icon170/icon170_user_{current_user.icon_id}.png'
    form_type = request.form.get('submit')
    if change_icon_form.validate_on_submit():
        if 'icon' in form_type:
            icon_data = change_icon_form.icon.data.read()
            check_have_icon = True
            if user.icon_id == -1:
                check_have_icon = False
                icon_id = randrange(10000000, 100000000)
                path = 'static/users_icons'
                while True:
                    if f'{path}/icon64/icon64_user_{icon_id}.png' in os.listdir(f'{path}/icon64/'):
                        icon_id = randrange(10000000, 100000000)
                    else:
                        break
                user.icon_id = icon_id
            icon64 = f'static/users_icons/icon64/icon64_user_{user.icon_id}.png'
            icon170 = f'static/users_icons/icon170/icon170_user_{user.icon_id}.png'
            old_icon_data = None
            try:
                if check_have_icon:
                    old_icon_data = open(icon64, 'rb').read()
                open(icon64, 'wb').write(icon_data)
                resize_image(icon64, (64, 64))
            except UnidentifiedImageError:
                if check_have_icon:
                    open(icon64, 'wb').write(old_icon_data)
                else:
                    os.remove(icon64)
                return render_template('edit_profile.html', **params, message='Cannot identify image file')
            del old_icon_data

            old_icon_data = None
            try:
                if check_have_icon:
                    old_icon_data = open(icon170, 'rb').read()
                open(icon170, 'wb').write(icon_data)
                resize_image(icon170, (170, 170))
            except UnidentifiedImageError:
                if check_have_icon:
                    open(icon170, 'wb').write(old_icon_data)
                else:
                    os.remove(icon170)
                return render_template('edit_profile.html', **params, message='Cannot identify image file')
        elif 'password' in form_type:
            if not user.check_password(change_password_form.old_password.data):
                return render_template('edit_profile.html', **params, password_error_message='Old password is wrong')
            if change_password_form.password.data != change_password_form.password_repeat.data:
                return render_template('edit_profile.html', **params, password_error_message="Passwords are not same")
            if len(change_password_form.password.data) < 8:
                params['message'] = 'Password is too short!'
                return render_template('edit_profile.html', **params)
            user.set_password(change_password_form.password.data)
        else:
            assert 0
        session.commit()
        return redirect(url_for('edit_profile_page'))
    return render_template('edit_profile.html', **params)


@app.route('/add_problem', methods=['GET', 'POST'])
@login_required
def add_problem_page():
    if current_user.account_type != 2:
        abort(403)
    session = db_session.create_session()
    params = page_params(2, 'Add Problem')
    form = AddProblemForm()
    params['form'] = form
    if form.validate_on_submit():
        problem_id = 1
        if session.query(Problem).first():
            problem_id = session.query(sqlalchemy_func.max(Problem.id)).one()[0] + 1
        problem = Problem(
            id=problem_id,
            time_limit=form.time_limit.data,
            memory_limit=form.memory_limit.data,
            title=form.title.data,
            category=form.category.data
        )
        os.mkdir(f'data/problems/{problem_id}')
        with ZipFile(BytesIO(form.test_data.data.read()), 'r') as file:
            file.extractall(f'data/problems/{problem.id}')
        os.mkdir(f'templates/problems/{problem_id}')
        with open(f'templates/problems/{problem_id}/statement.html', 'wb') as file:
            file.writelines([line.rstrip('\n').encode(encoding='utf-8', errors='strict')
                             for line in form.statement.data.read().decode('utf-8', errors='strict')])
        with open(f'templates/problems/{problem_id}/editorial.html', 'wb') as file:
            file.writelines([line.rstrip('\n').encode(encoding='utf-8', errors='strict')
                             for line in form.editorial.data.read().decode('utf-8', errors='strict')])
        session.add(problem)
        session.commit()
        return redirect('/problems')
    else:
        return render_template('add_problem.html', **params)


@app.route('/submissions')
def submissions_list_page():
    session = db_session.create_session()
    username = request.args.get('username')
    if username:
        user = session.query(User).filter(User.username == username).first()
        if user:
            params = page_params(-1, 'Submissions')
            params['submissions'] = session.query(Submission).filter(Submission.user_id == user.id).all()
            params['submissions'].reverse()
            if len(params['submissions']) > 10:
                params['submissions'] = params['submissions'][:10:]
            return render_template('submissions_list.html', **params)
        else:
            params = page_params(-1, 'Submissions')
            params['submissions'] = session.query(Submission).filter().all()
            params['submissions'].reverse()
            if len(params['submissions']) > 10:
                params['submissions'] = params['submissions'][:10:]
            return render_template('submissions_list.html', **params)
    else:
        params = page_params(-1, 'Submissions')
        params['submissions'] = session.query(Submission).filter().all()
        params['submissions'].reverse()
        if len(params['submissions']) > 10:
            params['submissions'] = params['submissions'][:10:]
        return render_template('submissions_list.html', **params)


@app.route('/problems')
def problems_list_page():
    params = page_params(2, 'Problems')
    with open('data/problems/PROBLEMS_CATEGORIES.json') as file:
        params['categories'] = json.loads(file.read())['categories']
        return render_template('problems_list.html', **params, show_categories=1)


@app.route('/problems/<category>')
def problems_by_category_page(category):
    session = db_session.create_session()
    params = page_params(2, 'Problems')
    if category == 'problemset':
        problems = session.query(Problem).all()
        params['problems'] = problems
        return render_template('problems_list.html', **params)
    d = json.loads(open('data/problems/PROBLEMS_CATEGORIES.json').read())['categories']
    long_category = ''
    for i in d:
        if i['short_name'] == category:
            long_category = i['long_name']
    if long_category == '':
        abort(404)
    problems = session.query(Problem).all()
    res = []
    for i in problems:
        if long_category in i.category.split(', '):
            res.append(i)
    params['problems'] = res
    return render_template('problems_list.html', **params)


@app.route('/problem/<problem_id>', methods=['GET', 'POST'])
def problem_page(problem_id: str):
    session = db_session.create_session()
    if problem_id.isdecimal():
        problem = session.query(Problem).filter(Problem.id == int(problem_id)).first()
        if problem:
            form = SubmitForm()
            params = page_params(2, problem.title)
            params['form'] = form
            params['problem_statement'] = f'problems/{problem_id}/statement.html'
            params['problem'] = problem
            params['current_bar_id'] = 1
            if form.validate_on_submit():
                if not current_user.is_authenticated:
                    params['message'] = 'You must be authorized to submit'
                    return render_template('problem.html', **params)
                code = request.form['code_area']
                if code:
                    if len(''.join(code)) > 65535:
                        params['message'] = "Code must contain no more 65535 symbols"
                        return render_template('problem.html', **params)
                    lang = request.form['language']
                    submission = Submission(
                        user_id=current_user.id,
                        problem_id=problem.id,
                        verdict='In queue',
                        time=0,
                        memory=0
                    )
                    submission_id = 1
                    if session.query(Submission).first():
                        submission_id = session.query(sqlalchemy_func.max(Submission.id)).one()[0] + 1
                    else:
                        os.mkdir('data/submissions')
                    submission.id = submission_id
                    path = f'data/submissions/{submission.id}'
                    os.mkdir(path)
                    if lang == 'py':
                        submission.language = 'Python 3'
                        file = open(f'{path}/source.py', 'wb')
                        file.writelines([line.rstrip('\n').encode(encoding='utf-8', errors='strict') for line in code])
                        file.close()
                    else:
                        submission.language = 'GNU C++14'
                        file = open(f'{path}/source.cpp', 'wb')
                        file.writelines([line.rstrip('\n').encode(encoding='utf-8', errors='strict') for line in code])
                        file.close()
                    session.add(submission)
                    session.commit()
                    return redirect(f'/problem/{problem_id}/submissions?user={current_user.username}')
                else:
                    params['message'] = 'You can not submit empty code'
                    return render_template('problem.html', **params)
            return render_template('problem.html', **params)
        else:
            abort(404)
    else:
        abort(404)


@app.route('/problem/<problem_id>/editorial')
def problem_editorial_page(problem_id: str):
    session = db_session.create_session()
    if problem_id.isdecimal():
        problem = session.query(Problem).filter(Problem.id == int(problem_id)).first()
        if problem:
            params = page_params(2, 'Editorial')
            params['current_bar_id'] = 2
            params['solution'] = open(f'data/problems/{problem_id}/author_sol.cpp', 'r').read()
            params['problem_editorial'] = f'problems/{problem_id}/editorial.html'
            params['problem'] = problem
            return render_template('editorial.html', **params)
        else:
            abort(404)
    else:
        abort(404)


@app.route('/problem/<problem_id>/submissions')
def submissions_on_problem_list(problem_id: str):
    session = db_session.create_session()
    if problem_id.isdecimal():
        problem = session.query(Problem).filter(Problem.id == int(problem_id)).first()
        if problem:
            params = page_params(2, 'Submissions')
            params['current_bar_id'] = 3
            params['problem'] = problem
            username = request.args.get('user')
            verdict = request.args.get('verdict')
            if verdict:
                if username:
                    user = session.query(User).filter(User.username == username).first()
                    if user:
                        params['submissions'] = session.query(Submission).filter(
                            Submission.problem_id == int(problem_id),
                            Submission.user_id == user.id,
                            Submission.verdict == verdict).all()
                    else:
                        params['submissions'] = session.query(Submission).filter(
                            Submission.problem_id == int(problem_id),
                            Submission.verdict == verdict).all()
                else:
                    params['submissions'] = session.query(Submission).filter(
                        Submission.problem_id == int(problem_id),
                        Submission.verdict == verdict).all()
                params['submissions'].reverse()
                if len(params['submissions']) > 10:
                    params['submissions'] = params['submissions'][:10:]
                return render_template('problem_submissions.html', **params)
            else:
                if username:
                    user = session.query(User).filter(User.username == username).first()
                    if user:
                        params['submissions'] = session.query(Submission).filter(
                            Submission.problem_id == int(problem_id),
                            Submission.user_id == user.id).all()
                    else:
                        params['submissions'] = session.query(Submission).filter(
                            Submission.problem_id == int(problem_id)).all()
                else:
                    params['submissions'] = session.query(Submission).filter(
                        Submission.problem_id == int(problem_id)).all()
                params['submissions'].reverse()
                if len(params['submissions']) > 10:
                    params['submissions'] = params['submissions'][:10:]
                return render_template('problem_submissions.html', **params)
        else:
            abort(404)
    else:
        abort(404)


@app.route('/submission/<submission_id>')
def submission_page(submission_id: str):
    sesion = db_session.create_session()
    submission = sesion.query(Submission).filter(Submission.id == int(submission_id)).first()
    if submission:
        params = page_params(2, f'Submission {submission_id}')
        params['item'] = submission
        if submission.language == 'Python 3':
            params['code'] = open(f'data/submissions/{submission_id}/source.py', 'r').read()
        else:
            params['code'] = open(f'data/submissions/{submission_id}/source.cpp', 'r').read()
        return render_template('submission.html', **params)
    else:
        abort(404)


@app.route('/jobs')
def jobs_list_page():
    session = db_session.create_session()
    username = request.args.get('user')
    params = page_params(3, 'Jobs')
    if username is None:
        params['jobs'] = session.query(Job).all()
    else:
        user = session.query(User).filter(User.username == username).first()
        if user is None:
            params['jobs'] = session.query(Job).all()
        else:
            params['jobs'] = user.jobs
    return render_template('jobs.html', **params)


@app.route('/job/<job_id>')
def job_page(job_id: str):
    session = db_session.create_session()
    job = session.query(Job).filter(Job.id == int(job_id)).first()
    if job is None:
        abort(404)
    params = page_params(3, f'Job {job.id}')
    params['job'] = job
    return render_template('job.html', **params)


@app.route('/add_job', methods=['GET', 'POST'])
@login_required
def add_job_page():
    session = db_session.create_session()
    if current_user.account_type == 0:
        abort(403)
    form = AddJobForm()
    params = page_params(3, 'Add Job')
    params['form'] = form
    if form.validate_on_submit():
        if len(form.title.data) > 30:
            params['message'] = 'Length of title is too long.'
            return render_template('add_job.html', **params)
        if len(form.short_info.data) > 100:
            params['message'] = 'Length of short info is too long.'
            return render_template('add_job.html', **params)
        if len(form.whole_info.data) > 300:
            params['message'] = 'Length of whole info is too long.'
            return render_template('add_job.html', **params)
        job_id = 1
        if session.query(Job).first():
            job_id = session.query(sqlalchemy_func.max(Job.id)).one()[0] + 1
        else:
            os.mkdir('static/jobs')
        job_random_id = randrange(10000000, 100000000)
        while True:
            if str(job_random_id) in os.listdir('static/jobs'):
                job_random_id = randrange(10000000, 100000000)
            else:
                break
        job = Job(
            id=job_id,
            title=form.title.data,
            user_id=current_user.id,
            job_id=job_random_id
        )
        session.add(job)
        session.commit()
        os.mkdir(f'static/jobs/{job_random_id}')
        with open(f'static/jobs/{job_random_id}/short_info.md', 'w') as file:
            file.write(form.short_info.data)
        with open(f'static/jobs/{job_random_id}/whole_info.md', 'w') as file:
            file.write(form.whole_info.data)
        return redirect('/jobs')
    else:
        return render_template('add_job.html', **params)


@app.route('/job/<job_id>/edit', methods=['GET', 'POST'])
@login_required
def job_edit_page(job_id: str):
    session = db_session.create_session()
    job = session.query(Job).filter(Job.id == int(job_id)).first()
    if job is None:
        abort(404)
    if current_user.account_type == 0:
        abort(403)
    if current_user.account_type == 1 and job not in current_user.jobs:
        abort(403)
    params = page_params(3, 'Edit Job')
    form = AddJobForm()
    params['form'] = form
    if request.method == 'GET':
        form.title.data = job.title
        with open(f'static/jobs/{job.job_id}/short_info.md', 'rb') as file:
            text = file.read()
            text = text.replace(b'\r', b'')
            form.short_info.data = text.decode('utf-8', errors='strict')
        with open(f'static/jobs/{job.job_id}/whole_info.md', 'rb') as file:
            text = file.read()
            text = text.replace(b'\r', b'')
            form.whole_info.data = text.decode('utf-8', errors='strict')
    if form.validate_on_submit():
        job.title = form.title.data
        with open(f'static/jobs/{job.job_id}/short_info.md', 'w') as file:
            file.write(form.short_info.data)
        with open(f'static/jobs/{job.job_id}/whole_info.md', 'w') as file:
            file.write(form.whole_info.data)
        session.commit()
        return redirect('/jobs')
    return render_template('add_job.html', **params)


@app.route('/job/<job_id>/delete')
@login_required
def job_delete_page(job_id: str):
    session = db_session.create_session()
    job = session.query(Job).filter(Job.id == int(job_id)).first()
    if job is None:
        abort(404)
    if current_user.account_type == 0:
        abort(403)
    if current_user.account_type == 1 and job not in current_user.jobs:
        abort(403)
    os.remove(f'static/jobs/{job.job_id}/short_info.md')
    os.remove(f'static/jobs/{job.job_id}/whole_info.md')
    os.rmdir(f'static/jobs/{job.job_id}')
    session.delete(job)
    session.commit()
    return redirect('/jobs')


if __name__ == '__main__':
    main()
