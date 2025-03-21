from celery import shared_task
from .models import Submission
import os
import shutil
import random
import subprocess
import logging
from logging.handlers import RotatingFileHandler
from .utils import run_isolate, run_tests
from app import settings


def configure_logger():
    logger = logging.getLogger(__name__)

    if not logger.handlers:
        log_file = settings.BASE_DIR / 'logs' / 'problemset.log'
        os.makedirs(os.path.dirname(log_file), exist_ok=True)

        handler = RotatingFileHandler(
            filename=log_file,
            maxBytes=50 * 1024 * 1024,  # 50MB
            backupCount=10
        )

        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)

        logger.addHandler(handler)

    return logger


logger = configure_logger()

LANGUAGE_CONFIGS = {
    'cpp': {
        'compile': ['/usr/bin/g++', '-std=c++17', 'source.cpp', '-o', 'program'],
        'run': ['./program'],
        'source_file': 'source.cpp'
    },
    'py': {
        'run': ['/usr/bin/python3', 'source.py'],
        'source_file': 'source.py'
    }
}


@shared_task
def test_submission_task(submission_id):
    try:
        submission = Submission.objects.get(id=submission_id)
    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} does not exist.")
        return

    if submission.verdict != 'IQ':
        logger.info(
            "Submission {submission_id} already processed with verdict" +
            f"{submission.verdict}."
        )
        return

    language = submission.language
    config = LANGUAGE_CONFIGS.get(language)

    box_id = random.randint(1, 999)

    try:
        subprocess.run(
            ['isolate', '--cg', '--box-id', str(box_id), '--init'],
            check=True
        )
        logger.info(
            "Initialized isolate box with box_id={box_id} for submission" +
            f"={submission_id}"
        )
    except subprocess.CalledProcessError:
        submission.verdict = 'RE 1'
        submission.save()
        logger.error(f"Failed to initialize isolate box for submission {submission_id}")
        return

    isolate_box_path = f'{settings.ISOLATE_PATH}/{box_id}/box'
    try:
        with open(os.path.join(isolate_box_path, config['source_file']), 'w') as f:
            f.write(submission.code)
        logger.info(
            f"Copied source file to isolate box: {submission_id} -> {isolate_box_path}"
        )
    except (FileNotFoundError, shutil.Error) as e:
        submission.verdict = 'RE 1'
        submission.save()
        logger.error(f"Failed to copy source file for submission {submission_id}: {e}")
        subprocess.run(['isolate', '--cg', '--box-id', str(box_id), '--cleanup'])
        return

    try:
        if 'compile' in config:
            compile_cmd = config['compile']
            compile_result = run_isolate(
                box_id,
                compile_cmd,
                time_limit=5,
                mem_limit=256 * 1024,
                is_compile=True
            )
            if not compile_result.get('run_success', False):
                submission.verdict = 'CE'
                submission.time = 0
                submission.memory = 0
                submission.save()
                return

        run_tests(
            box_id,
            config,
            submission.problem.id,
            time_limit=submission.problem.time_limit,
            mem_limit=submission.problem.memory_limit * 1024,
            submission=submission
        )
    except Exception as e:
        submission.verdict = 'RE 1'
        submission.save()
        logger.error(f"Error while testing submission {submission_id}: {e}")
    finally:
        subprocess.run(['isolate', '--cg', '--box-id', str(box_id), '--cleanup'])
        logger.info(
            f"Cleaned up isolate box with box_id={box_id} for submission" +
            f"{submission_id}"
        )


@shared_task
def process_submission_queue():
    submissions = Submission.objects.filter(verdict='IQ')[:30]
    if settings.NO_ISOLATE:
        for submission in submissions:
            submission.verdict = 'RE 1'
            submission.time = random.randint(0,
                                            int(submission.problem.time_limit * 1000))
            submission.memory = random.randint(0,
                                            int(submission.problem.memory_limit * 1024))
            submission.save()
        logger.warning("NO_ISOLATE is set to True. Skipping submission processing.")
        return
    for submission in submissions:
        test_submission_task.delay(submission.id)
