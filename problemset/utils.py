import subprocess
import os
from app.settings import ISOLATE_PATH


def parse_meta_file(meta_file_path):
    meta_data = {}
    try:
        with open(meta_file_path, 'r') as file:
            for line in file:
                if ":" in line:
                    key, value = line.strip().split(":", 1)
                    try:
                        value = float(value) if '.' in value else int(value)
                    except ValueError:
                        pass
                    meta_data[key] = value
    except FileNotFoundError:
        pass
    return meta_data


def run_isolate(box_id, cmd, time_limit, mem_limit, input_data=None, is_compile=False):
    isolate_cmd = [
        'isolate', f'--box-id={box_id}',
        '--cg',
        f'--time={time_limit}',
        f'--wall-time={time_limit * 2}',
        f'--cg-mem={mem_limit}',
        f'--meta={ISOLATE_PATH}/{box_id}/box/meta.txt',
    ]

    if is_compile:
        isolate_cmd.extend([
            '--processes=4',
            '--env=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
        ])

    isolate_cmd.append('--run')
    isolate_cmd.append('--')
    isolate_cmd.extend(cmd)

    try:
        result = subprocess.run(isolate_cmd, input=input_data, capture_output=True,
                                timeout=time_limit * 2)
        res = parse_meta_file(f'{ISOLATE_PATH}/{box_id}/box/meta.txt')
        res['stdout'] = result.stdout.decode()
        res['run_success'] = result.returncode == 0
    except subprocess.TimeoutExpired:
        res = {'status': 'TO', 'run_success': False, 'stdout': ''}
    return res


def run_tests(box_id, config, problem_id, time_limit, mem_limit, submission):
    path_to_tests = os.path.join('data', 'problems', str(problem_id), 'tests')
    stat = {
        'verdict': 'AC',
        'time': 0,
        'memory': 0
    }
    test_case = 0
    input_dir = os.path.join(path_to_tests, 'input')
    output_dir = os.path.join(path_to_tests, 'output')

    for filename in sorted(os.listdir(input_dir)):
        test_case += 1
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)

        with open(input_path, 'rb') as input_file:
            input_data = input_file.read()

        res = run_isolate(box_id, config['run'], time_limit, mem_limit, input_data)

        stat['time'] = max(stat['time'], int(res.get('time', 0) * 1000))
        stat['memory'] = max(stat['memory'], int(res.get('max-rss', 0)))
        if not res.get('run_success', False):
            if res.get('max-rss', 0) >= mem_limit:
                stat['verdict'] = f'MLE {test_case}'
                stat['memory'] = mem_limit
                break
            elif res.get('status') == 'TO':
                stat['verdict'] = f'TLE {test_case}'
                stat['time'] = time_limit * 1000
                break
            elif res.get('status') in ['RE', 'SG']:
                stat['verdict'] = f'RE {test_case}'
                break

        try:
            with open(output_path, 'r') as output_file:
                expected_output = output_file.read().strip()
            actual_output = res['stdout'].strip()
            if actual_output != expected_output:
                stat['verdict'] = f'WA {test_case}'
                break
        except FileNotFoundError:
            stat['verdict'] = f'WA {test_case}'
            break

    submission.verdict = stat['verdict']
    submission.time = stat['time']
    submission.memory = stat['memory']

    if submission.verdict == 'AC':
        if submission.problem in submission.user.problems_unsolved.all():
            submission.user.problems_unsolved.remove(submission.problem)
        if submission.problem not in submission.user.problems_solved.all():
            submission.user.problems_solved.add(submission.problem)
    else:
        if (submission.problem not in submission.user.problems_solved.all() and
            submission.problem not in submission.user.problems_unsolved.all()):
            submission.user.problems_unsolved.add(submission.problem)
    submission.save()
