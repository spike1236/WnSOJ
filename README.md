# WnSOJ - Work and Solve online judge! 
WnSOJ is a platform where you can solve programming and math tasks, learn new algorithms and terms and find job. Platform includes `testing system`, `problems categories`, `problems`, `editorials and solutions`, `submissions`, `job search`, `users` and `statistics`.

![Main Page](https://github.com/spike1236/WnSOJ/blob/main/readme_screenshots/screenshot_1.png)

## Getting Started
1. Download a project. To download required components, write in command line:
```shell
pip install -r requirements.txt
```
2. Install g++ compiler, Python, Isolate; Work and Solve Online Judge uses isolate's cgroups, check its manual for setup.
<!-- 4. Watch the [video](https://youtu.be/WXRyMGD6RH8) to learn more about project; -->
3. Launch server:
```shell
python3 main.py
```
4. Open [Main page](http://127.0.0.1:5000)
5. Enjoy project! :sunglasses:

## About Project
### Problems and submissions
Platform provides an extensive set of olympiad programming tasks. To submit solution you need to be signed in system. You can register or sign in into existing account and submit solutions to problems.
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
In the profile, you can see user's username, email, phone number and statistics about problems: last 10 submissions and verdicts statistics.\
Also you can change icon and password in your account page.
### API
Also, platform is rich for API.
In API you can request:

* users list and user by id
* jobs list and job by id
* submissions list and submission by id
* problems list and problem by id

API is located by url [http://127.0.0.1:5000/api/v1](http://127.0.0.1:5000/api/v1)

#### Examples:

* request: [http://127.0.0.1:5000/api/v1/user/1](http://127.0.0.1:5000/api/v1/user/1)\
response:
  ```json
  {
    "user": {
      "email": "admin@admin.com",
      "fullname": "admin admin",
      "phone_number": "",
      "username": "admin"
    }
  }
  ```

* request: [http://127.0.0.1:5000/api/v1/submission/1](http://127.0.0.1:5000/api/v1/submission/1)\
response:
  ```json
  {
    "submission": {
      "language": "GNU C++17",
      "memory": 2476,
      "send_time": "24/Apr/2021  22:06  UTC+6",
      "time": 233,
      "user": {
        "username": "admin"
      },
      "verdict": "AC"
    }
  }
  ```

* request: [http://127.0.0.1:5000/api/v1/jobs](http://127.0.0.1:5000/api/v1/jobs)\
response:
  ```json
  {
    "jobs": [
      {
        "title": "test job",
        "user": {
          "username": "admin"
        }
      }
    ]
  }
  ```
## Technologies
Following technologies and libraries were used to create this project:
* [Flask](https://flask.palletsprojects.com/en/1.1.x)
* [WT Forms](https://wtforms.readthedocs.io/en/2.3.x)
* [SQLAlchemy](https://docs.sqlalchemy.org/en/14)
* [isolate](https://github.com/ioi/isolate)
* [subprocess](https://docs.python.org/3/library/subprocess.html)
* [Pillow](https://pillow.readthedocs.io/en/stable)
* [ZipFile](https://docs.python.org/3/library/zipfile.html)
* [io](https://docs.python.org/3/library/io.html)
* [multiprocessing](https://docs.python.org/3/library/multiprocessing.html)
## Components (CSS and JS)
Following components were used to create this project:
* [jQuery](https://jquery.com)
* [Bootstrap](https://getbootstrap.com/docs/4.6/getting-started/introduction)
* [CodeMirror](https://codemirror.net)
* [MathJax](https://www.mathjax.org)
* [marked](https://marked.js.org)
## Author
* **Rakhmetulla Akram** - [spike1236](https://github.com/spike1236)
## License
This work is licensed under a [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License](https://creativecommons.org/licenses/by-nc-nd/4.0).\
See [LICENSE](https://github.com/spike1236/WnSOJ/blob/main/LICENSE.md) file for details.
