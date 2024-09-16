import os
import random
import shutil
import subprocess
import threading
from data import db_session
from data.submissions import Submission

LANGUAGE_CONFIGS = {
    'GNU C++17': {
        'compile': ['/usr/bin/g++', '-std=c++17', 'source.cpp', '-o', 'program'],
        'run': ['./program'],
        'source_file': 'source.cpp'
    },
    'Python 3': {
        'run': ['/usr/bin/python3', 'source.py'],
        'source_file': 'source.py'
    }
}


def parse_meta_file(meta_file_path):
    meta_data = {}
    with open(meta_file_path, 'r') as file:
        for line in file:
            if ":" in line:
                key, value = line.strip().split(":", 1)
                try:
                    value = float(value) if '.' in value else int(value)
                except ValueError:
                    pass
                meta_data[key] = value
    return meta_data


def run_isolate(box_id, cmd, time_limit, mem_limit, input_data=None, is_compile=False):
    isolate_cmd = [
        'isolate', f'--box-id={box_id}',
        '--cg',
        '--env=HOME=/home/user',
        f'--time={time_limit}',
        f'--wall-time={time_limit * 2}',
        f'--cg-mem={mem_limit}',
        f'--meta=/var/local/lib/isolate/{box_id}/box/meta.txt',
    ]
    
    if is_compile:
        isolate_cmd.extend([
            '--processes=4',
            '--env=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
        ])
    
    isolate_cmd.append('--run')
    isolate_cmd.append('--')
    isolate_cmd.extend(cmd)
    
    result = subprocess.run(isolate_cmd, input=input_data, capture_output=True)
    res = parse_meta_file(f'/var/local/lib/isolate/{box_id}/box/meta.txt')
    res['stdout'] = result.stdout.decode()
    res['run_success'] = result.returncode == 0
    return res


def run_tests(box_id, config, problem_id, run_time_limit, run_mem_limit):
    path_to_tests = f'data/problems/{problem_id}/tests'
    stat = {
        'verdict': 'In queue',
        'time': 0,
        'memory': 0
    }

    test_case = 0

    for filename in os.listdir(f'{path_to_tests}/input'):
        test_case += 1
        input_path = os.path.join(path_to_tests, 'input', filename)
        output_path = os.path.join(path_to_tests, 'output', filename)

        with open(input_path, 'rb') as input_file:
            input_data = input_file.read()
        
        res = run_isolate(box_id, config['run'], run_time_limit, run_mem_limit, input_data)
        stat['time'] = max(stat['time'], int(res.get('time', 0) * 1000))
        stat['memory'] = max(stat['memory'], int(res.get('max-rss', 0)))
        if not res['run_success']:
            if res['max-rss'] >= run_mem_limit:
                stat['verdict'] = f'MLE {test_case}'
                stat['memory'] = run_mem_limit
                return stat
            elif res['status'] == 'TO':
                stat['verdict'] = f'TLE {test_case}'
                stat['time'] = run_time_limit * 1000
                return stat
            else:  # res['status'] == 'RE' or res['status'] == 'SG':
                stat['verdict'] = f'RE {test_case}'
                return stat
        
        with open(output_path, 'r') as output_file:
            expected_output = output_file.read().strip()
        actual_output = res['stdout'].strip()
        if actual_output != expected_output:
            stat['verdict'] = f'WA {test_case}'
            return stat
    
    stat['verdict'] = 'AC'
    return stat


def test_submission(submission_id, language, problem_id, compile_time_limit=5, compile_mem_limit=256*1024,
                    run_time_limit=1, run_mem_limit=256*1024):
    if language not in LANGUAGE_CONFIGS:
        print(f"Unsupported language: {language}")
        return

    config = LANGUAGE_CONFIGS[language]
    box_id = random.randint(0, 1000)

    subprocess.run(['isolate', '--cg', '--box-id', str(box_id), '--init'], capture_output=True, text=True)
    shutil.copy(f'data/submissions/{submission_id}/{config["source_file"]}',
                os.path.join(f'/var/local/lib/isolate/{box_id}/box', config['source_file']))

    try:
        if 'compile' in config:
            compile_result = run_isolate(box_id, config['compile'], compile_time_limit, compile_mem_limit, is_compile=True)
            if not compile_result['run_success']:
                return {
                    'verdict': 'CE',
                    'time': 0,
                    'memory': 0
                }

        stat = run_tests(box_id, config, problem_id, run_time_limit, run_mem_limit)

    finally:
        subprocess.run(['isolate', '--cg', '--box-id', str(box_id), '--cleanup'])
    
    return stat


def queue():
    global session
    submissions = session.query(Submission).filter(Submission.verdict == 'In queue').all()
    for submission in submissions:
        result = test_submission(submission.id, submission.language, submission.problem_id, run_time_limit=submission.problem.time_limit, run_mem_limit=submission.problem.memory_limit*1024)
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
    global session
    db_session.global_init("db/main.sqlite")
    session = db_session.create_session()
    
    def debounce(interval, func):
        func()
        threading.Timer(interval, debounce, [interval, func]).start()
    
    debounce(1, queue)
