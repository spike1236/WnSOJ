from data import db_session
from data.submissions import Submission
import subprocess
import psutil
import os
import datetime
# import schedule


def run_tests(submission):
    stat = {}
    run_args = f'static/submissions/{submission.id}'
    path_to_tests = f'data/problems/{submission.problem_id}/tests'
    if submission.language == 'GNU C++14':
        compile_process = subprocess.Popen(f'g++ {run_args}/source.cpp -std=c++14 -o {run_args}/source.exe',
                                           stderr=subprocess.PIPE)
        compile_process.wait()
        if compile_process.stderr.read():
            stat['verdict'] = 'CE'
            stat['time'] = 0
            stat['memory'] = 0
            return stat
        run_args += '/source.exe'
    else:
        run_args = f'py {run_args}/source.py'
    test_index = 1
    max_time = 0
    max_memory = 0
    for filename in os.listdir(f'{path_to_tests}/input'):
        input_file = open(f'{path_to_tests}/input/{filename}', 'r')
        correct_output = open(f'{path_to_tests}/output/{filename}', 'r').read()
        time_before_testing = datetime.datetime.now()
        memory_used = None
        try:
            test_run_process = subprocess.Popen(run_args, stdin=input_file,
                                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            memory_used = psutil.Process(test_run_process.pid).memory_info().rss
            test_run_process.wait(submission.problem.time_limit)
        except subprocess.TimeoutExpired:
            stat['verdict'] = f'TLE {test_index}'
            stat['time'] = int(submission.problem.time_limit * 1000)
            stat['memory'] = memory_used // (2 ** 20)
            return stat
        testing_time = int((datetime.datetime.now() - time_before_testing).microseconds / 1000)
        if memory_used > submission.problem.memory_limit * (2 ** 20):
            stat['verdict'] = f'MLE {test_index}'
            stat['time'] = testing_time
            stat['memory'] = submission.problem.memory_limit
            return stat
        submission_output = \
            test_run_process.stdout.read().decode('ascii').strip('\n').strip(' ')
        if submission_output != correct_output:
            stat['verdict'] = f'WA {test_index}'
            stat['time'] = testing_time
            stat['memory'] = memory_used // (2 ** 20)
            return stat
        test_index += 1
        max_time = max(max_time, testing_time)
        max_memory = max(max_memory, memory_used)
    stat['verdict'] = 'AC'
    stat['time'] = max_time
    stat['memory'] = max_memory // (2 ** 20)
    return stat


def queue():
    session = db_session.create_session()
    submissions = session.query(Submission).filter(Submission.verdict == 'In queue').all()
    for submission in submissions:
        result = run_tests(submission)
        submission.verdict = result['verdict']
        submission.time = result['time']
        submission.memory = result['memory']
        problem = submission.problem
        if submission.verdict == 'AC':
            if problem in submission.user.problems_unsolved:
                submission.user.problems_unsolved.remove(problem)
            if problem not in submission.user.problems_solved:
                submission.user.problems_solved.append(problem)
        else:
            if problem not in submission.user.problems_solved and problem not in submission.user.problems_unsolved:
                submission.user.problems_unsolved.append(problem)
        session.commit()


def test_forever():
    db_session.global_init("db/main.sqlite")
    # schedule.every(1).seconds.do(queue)

    while True:
        queue()
