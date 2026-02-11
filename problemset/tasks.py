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
from django.utils import timezone
from .realtime import clear_submission_progress, publish_submission_final


def configure_logger():
    logger = logging.getLogger(__name__)

    if not logger.handlers:
        log_file = settings.BASE_DIR / "logs" / "problemset.log"
        os.makedirs(os.path.dirname(log_file), exist_ok=True)

        handler = RotatingFileHandler(
            filename=log_file,
            maxBytes=50 * 1024 * 1024,
            backupCount=10,
        )

        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)

        logger.addHandler(handler)

    return logger


logger = configure_logger()

LANGUAGE_CONFIGS = {
    "cpp": {
        "compile": [
            "/usr/bin/g++",
            "-O2",
            "-std=c++23",
            "-DONLINE_JUDGE",
            "source.cpp",
            "-o",
            "program",
        ],
        "run": ["./program"],
        "source_file": "source.cpp",
    },
    "py": {"run": ["/usr/bin/python3.12", "source.py"], "source_file": "source.py"},
}


@shared_task
def test_submission_task(submission_id):
    try:
        submission = Submission.objects.get(id=submission_id)
    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} does not exist.")
        return

    if submission.verdict != "IQ":
        logger.info(
            f"Submission {submission_id} already processed with verdict {submission.verdict}."
        )
        return

    clear_submission_progress(submission_id)

    if settings.NO_ISOLATE:
        submission.verdict = "RE 1"
        submission.time = random.randint(0, int(submission.problem.time_limit * 1000))
        submission.memory = random.randint(
            0, int(submission.problem.memory_limit * 1024)
        )
        submission.save()
        publish_submission_final(submission)
        logger.warning(
            "NO_ISOLATE is set to True. Skipping isolate execution for "
            f"submission {submission_id}."
        )
        return

    language = submission.language
    config = LANGUAGE_CONFIGS.get(language)

    if not config:
        submission.verdict = "RE 1"
        submission.time = 0
        submission.memory = 0
        submission.save()
        publish_submission_final(submission)
        logger.error(
            f"Unknown language '{language}' for submission {submission_id}."
        )
        return

    box_id = random.randint(1, 999)

    try:
        subprocess.run(
            ["isolate", "--cg", "--box-id", str(box_id), "--cleanup"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            ["isolate", "--cg", "--box-id", str(box_id), "--init"], check=True
        )
        logger.info(
            f"Initialized isolate box with box_id={box_id} for submission={submission_id}"
        )
    except subprocess.CalledProcessError:
        submission.verdict = "RE 1"
        submission.save()
        publish_submission_final(submission)
        logger.error(f"Failed to initialize isolate box for submission {submission_id}")
        return

    isolate_box_path = f"{settings.ISOLATE_PATH}/{box_id}/box"
    try:
        with open(os.path.join(isolate_box_path, config["source_file"]), "w") as f:
            f.write(submission.code)
        logger.info(
            f"Copied source file to isolate box: {submission_id} -> {isolate_box_path}"
        )
    except (FileNotFoundError, shutil.Error) as e:
        submission.verdict = "RE 1"
        submission.save()
        publish_submission_final(submission)
        logger.error(f"Failed to copy source file for submission {submission_id}: {e}")
        subprocess.run(["isolate", "--cg", "--box-id", str(box_id), "--cleanup"])
        return

    try:
        if "compile" in config:
            compile_cmd = config["compile"]
            compile_result = run_isolate(
                box_id,
                compile_cmd,
                time_limit=15,
                mem_limit=512 * 1024,
                is_compile=True,
            )
            logger.info(
                f"Compilation result for submission {submission_id}: {compile_result}"
            )
            if not compile_result.get("run_success", False):
                submission.verdict = "CE"
                submission.time = 0
                submission.memory = 0
                submission.save()
                publish_submission_final(submission)
                return

        run_tests(
            box_id,
            config,
            submission.problem.id,
            time_limit=submission.problem.time_limit,
            mem_limit=submission.problem.memory_limit * 1024,
            submission=submission,
        )
    except Exception as e:
        submission.verdict = "RE 1"
        submission.save()
        publish_submission_final(submission)
        logger.error(f"Error while testing submission {submission_id}: {e}")
    finally:
        subprocess.run(["isolate", "--cg", "--box-id", str(box_id), "--cleanup"])
        logger.info(
            f"Cleaned up isolate box with box_id={box_id} for submission"
            + f"{submission_id}"
        )


def _chunks(items: list[int], size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


@shared_task
def retest_submissions_task(submission_ids: list[int]):
    if not submission_ids:
        return {"queued": 0}

    ids = [int(i) for i in submission_ids if isinstance(i, int) or (isinstance(i, str) and i.isdigit())]
    if not ids:
        return {"queued": 0}

    now = timezone.now()
    queued = 0
    for batch in _chunks(ids, 500):
        to_queue = list(
            Submission.objects.filter(id__in=batch).exclude(verdict="IQ").values_list("id", flat=True)
        )
        if not to_queue:
            continue
        Submission.objects.filter(id__in=to_queue).update(
            verdict="IQ", time=0, memory=0, updated_at=now
        )
        for submission_id in to_queue:
            clear_submission_progress(submission_id)
            test_submission_task.delay(submission_id)
            queued += 1

    return {"queued": queued}


@shared_task
def retest_all_submissions_task():
    ids = list(Submission.objects.exclude(verdict="IQ").values_list("id", flat=True))
    return retest_submissions_task(ids)
