from pathlib import Path
from types import SimpleNamespace
from typing import Any

from django.conf import settings
from django.db import transaction

from .realtime import publish_submission_event, publish_submission_final


def build_judge_request(submission) -> Any:
    return build_judge_request_for_box(
        submission,
        isolate_box_id=int(settings.JUDGE_ISOLATE_BOX_ID),
    )


def build_judge_request_for_box(submission, *, isolate_box_id: int) -> Any:
    from judge_engine import JudgeRequest

    return JudgeRequest(
        submission_id=submission.id,
        problem_id=submission.problem_id,
        language=submission.language,
        code=submission.code,
        tests_root=Path(settings.PROBLEMS_DATA_ROOT)
        / str(submission.problem_id)
        / "tests",
        time_limit_seconds=submission.problem.time_limit,
        memory_limit_kb=submission.problem.memory_limit * 1024,
        isolate_path=Path(settings.ISOLATE_PATH),
        isolate_box_id=isolate_box_id,
    )


def publish_judge_progress(progress: Any) -> None:
    publish_submission_event(
        progress.submission_id,
        {
            "kind": "progress",
            "id": progress.submission_id,
            "verdict": progress.verdict,
            "stage": progress.stage,
            "current_test": progress.current_test,
            "total_tests": progress.total_tests,
        },
    )


def update_user_problem_status(submission) -> None:
    if submission.verdict == "AC":
        if submission.problem in submission.user.problems_unsolved.all():
            submission.user.problems_unsolved.remove(submission.problem)
        if submission.problem not in submission.user.problems_solved.all():
            submission.user.problems_solved.add(submission.problem)
    elif (
        submission.problem not in submission.user.problems_solved.all()
        and submission.problem not in submission.user.problems_unsolved.all()
    ):
        submission.user.problems_unsolved.add(submission.problem)


def apply_judge_result_to_submission(
    submission,
    result: Any,
    *,
    publish_final: bool = True,
) -> None:
    submission.verdict = result.verdict
    submission.time = result.time_ms
    submission.memory = result.memory_kb
    update_user_problem_status(submission)
    submission.save()
    if publish_final:
        final_snapshot = SimpleNamespace(
            id=submission.id,
            verdict=submission.verdict,
            time=submission.time,
            memory=submission.memory,
            updated_at=submission.updated_at,
        )
        transaction.on_commit(
            lambda snapshot=final_snapshot: publish_submission_final(snapshot)
        )
