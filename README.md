# WnSOJ - Work and Solve online judge! 
WnSOJ is a platform where you can solve programming and math tasks, learn new algorithms and concepts and find job. Platform offers `effective testing system`, `categorized problemset`, `editorials and solutions`, `submissions`, `job search`, `users` and `statistics`.

![Main Page](https://github.com/spike1236/WnSOJ/blob/main/readme_screenshots/screenshot_1.png)

## Getting Started
1. Download the project:
```shell
git clone https://github.com/spike1236/WnSOJ.git
cd WnSOJ
```
2. Download required Python modules:
```shell
pip install -r requirements.txt
```
3. Install g++ compiler, [isolate](https://github.com/ioi/isolate); Work and Solve Online Judge uses cgroups v2-based isolate, check [this](https://askubuntu.com/questions/1469526/how-can-i-turn-on-cgroup-v2-cpu-controller-on-modern-ubuntu) for installation.
<!-- 4. Watch the [video](https://youtu.be/WXRyMGD6RH8) to learn more about project; -->
4. Fill out `./.pgpass`, `./.env` and `~/.pg_service.conf` according to provided templates.
5. Launch server and testing system (celery worker):
```shell
python3 manage.py runserver
celery -A app worker -B -l info
```
6. Open [Main page](http://127.0.0.1:8000)
7. Enjoy the project! :sunglasses:

## About Project
### Problems and submissions
Platform provides an extensive set of olympiad programming tasks. To submit solution you need to be signed in system. You can register or sign in into existing account and submit solutions to problems. The testing system runs in parallel with server using Celery worker. You can use Redis, RabbitMQ or Amazon SQS as a broker for Celery worker (more info [here](https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers); personally, I use [Redis](https://redis.io/)).
System will automatically test your solution in isolated sandboxes provided by [isolate](https://github.com/ioi/isolate) and report verdict, max used time and max used memory.\
Also, each problem has editorial and solution in C++ language.\
Platform administrators can add new problems.
### Jobs
In the platform you can also find or publish/edit/delete job.
There are 2 types of accounts:
1. Common account - these users can find job and communicate with employers by email or phone.\
   Open job that you liked, read the description and if job suits you, communicate with employer by email or phone.
2. Business account - these users or companies can publish, edit or delete jobs, also find and communicate by email or phone with other users.\
   Publish job, edit it if it is need, and just wait until some qualified specialist will communicate with you by email or phone number.
### Profile
In the profile, you can see user's username, email, phone number and statistics about problems: submissions statistics and last 10 attempts.\
Also you can change your icon or password in 'Edit profile' page.
## Technologies
Following technologies and libraries were used to create this project:
* [Django](https://www.djangoproject.com)
* [PostgreSQL](https://www.postgresql.org)
* [isolate](https://github.com/ioi/isolate)
* [Celery](https://docs.celeryq.dev/en/stable)
* [Redis](https://redis.io)
* [Pillow](https://pillow.readthedocs.io/en/stable)
* [ZipFile](https://docs.python.org/3/library/zipfile.html)
* [io](https://docs.python.org/3/library/io.html)
## Components (CSS and JS)
Following components were used to create this project:
* [Bootstrap](https://getbootstrap.com)
* [CodeMirror](https://codemirror.net)
* [marked](https://marked.js.org)
* [katex](https://katex.org)
* [FontAwesome](https://fontawesome.com)
