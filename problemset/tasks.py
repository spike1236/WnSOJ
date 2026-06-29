import logging
import os
import random
import socket
import threading
from datetime import timedelta
from logging.handlers import RotatingFileHandler
from pathlib import Path
from types import SimpleNamespace

from django.conf import settings
from django.db import IntegrityError, close_old_connections, connection, transaction
from django.db.models import Q
from django.utils import timezone

from .models import JudgeJob, Submission
from .realtime import clear_submission_progress
from .utils import (
    apply_judge_result_to_submission,
    build_judge_request_for_box,
    publish_judge_progress,
)


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


ACTIVE_JOB_STATUSES = [JudgeJob.Status.QUEUED, JudgeJob.Status.RUNNING]


class IsolateBoxLockError(RuntimeError):
    pass


def current_worker_id() -> str:
    configured = getattr(settings, "JUDGE_WORKER_ID", "")
    if configured:
        return configured
    return f"{socket.gethostname()}:{os.getpid()}"


def default_isolate_box_id() -> int:
    return int(getattr(settings, "JUDGE_ISOLATE_BOX_ID", 1))


def judge_job_lease_seconds() -> float:
    return float(getattr(settings, "JUDGE_JOB_LEASE_SECONDS", 900))


def judge_job_heartbeat_interval_seconds() -> float:
    configured = float(getattr(settings, "JUDGE_JOB_HEARTBEAT_INTERVAL_SECONDS", 30))
    lease_seconds = judge_job_lease_seconds()
    if configured <= 0:
        configured = 30
    if lease_seconds <= 0:
        return configured
    return min(configured, max(lease_seconds / 3, 0.001))


def _lease_expires_at(now):
    return now + timedelta(seconds=judge_job_lease_seconds())


def _pid_is_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def _lock_pid(lock_path: Path) -> int | None:
    try:
        lines = lock_path.read_text().splitlines()
    except OSError:
        return None

    for line in lines:
        if line.startswith("pid="):
            try:
                return int(line.removeprefix("pid=").strip())
            except ValueError:
                return None
    try:
        return int((lines[0] if lines else "").strip())
    except ValueError:
        return None


def _clear_stale_box_lock(lock_path: Path) -> bool:
    pid = _lock_pid(lock_path)
    if pid and _pid_is_running(pid):
        return False

    try:
        lock_path.unlink()
    except FileNotFoundError:
        pass
    except OSError:
        return False
    return True


def acquire_isolate_box_lock(box_id: int, worker_id: str | None = None) -> Path:
    lock_dir = Path(
        getattr(settings, "JUDGE_ISOLATE_LOCK_DIR", "/tmp/wnsoj-isolate-locks")
    )
    lock_dir.mkdir(parents=True, exist_ok=True)
    lock_path = lock_dir / f"{int(box_id)}.lock"
    worker_id = worker_id or current_worker_id()

    for _ in range(2):
        try:
            fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            if _clear_stale_box_lock(lock_path):
                continue
            try:
                details = lock_path.read_text().strip()
            except OSError:
                details = "unreadable lock file"
            raise IsolateBoxLockError(
                f"Isolate box {box_id} is already locked by another worker: {details}"
            )

        with os.fdopen(fd, "w") as lock_file:
            lock_file.write(
                f"pid={os.getpid()}\nworker_id={worker_id}\nbox_id={int(box_id)}\n"
            )
        return lock_path

    raise IsolateBoxLockError(f"Could not acquire isolate box {box_id} lock.")


def release_isolate_box_lock(lock_path: Path | None) -> None:
    if not lock_path:
        return
    lock_path = Path(lock_path)
    pid = _lock_pid(lock_path)
    if pid != os.getpid():
        return
    try:
        lock_path.unlink()
    except FileNotFoundError:
        pass


def _judge_result(
    *,
    verdict: str,
    time_ms: int = 0,
    memory_kb: int = 0,
    error: str = "",
):
    return SimpleNamespace(
        verdict=verdict,
        time_ms=time_ms,
        memory_kb=memory_kb,
        error=error,
    )


def _create_judge_job_if_queued(submission_id: int) -> JudgeJob | None:
    with transaction.atomic():
        try:
            submission = Submission.objects.select_for_update().get(id=submission_id)
        except Submission.DoesNotExist:
            logger.error(f"Submission {submission_id} does not exist.")
            return None

        if submission.verdict != "IQ":
            logger.info(
                "Submission "
                f"{submission_id} already processed with verdict {submission.verdict}."
            )
            return None

        active_job = (
            JudgeJob.objects.filter(
                submission=submission,
                status__in=ACTIVE_JOB_STATUSES,
            )
            .order_by("-id")
            .first()
        )
        if active_job:
            return active_job

        try:
            with transaction.atomic():
                return JudgeJob.objects.create(submission=submission)
        except IntegrityError:
            return (
                JudgeJob.objects.filter(
                    submission=submission,
                    status__in=ACTIVE_JOB_STATUSES,
                )
                .order_by("-id")
                .first()
            )


def queue_submission_for_judging(submission_id: int) -> JudgeJob | None:
    return _create_judge_job_if_queued(submission_id)


def claim_judge_job(job_id: int, worker_id: str | None = None):
    worker_id = worker_id or current_worker_id()
    now = timezone.now()

    with transaction.atomic():
        try:
            job = JudgeJob.objects.select_for_update().get(id=job_id)
        except JudgeJob.DoesNotExist:
            logger.error(f"Judge job {job_id} does not exist.")
            return None

        if job.is_terminal:
            return None

        if (
            job.status == JudgeJob.Status.RUNNING
            and job.lease_expires_at
            and job.lease_expires_at > now
        ):
            return None

        job.status = JudgeJob.Status.RUNNING
        job.attempt += 1
        job.claimed_by = worker_id
        job.lease_expires_at = _lease_expires_at(now)
        job.last_heartbeat_at = now
        if not job.started_at:
            job.started_at = now
        job.error = ""
        job.save(
            update_fields=[
                "status",
                "attempt",
                "claimed_by",
                "lease_expires_at",
                "last_heartbeat_at",
                "started_at",
                "error",
                "updated_at",
            ]
        )
        return {"job_id": job.id, "attempt": job.attempt, "worker_id": worker_id}


def _select_for_update(queryset):
    if connection.features.has_select_for_update_skip_locked:
        return queryset.select_for_update(skip_locked=True)
    return queryset.select_for_update()


def claim_next_judge_job(worker_id: str | None = None):
    worker_id = worker_id or current_worker_id()
    now = timezone.now()

    with transaction.atomic():
        job = (
            _select_for_update(JudgeJob.objects)
            .filter(
                Q(status=JudgeJob.Status.QUEUED)
                | Q(status=JudgeJob.Status.RUNNING, lease_expires_at__lte=now)
            )
            .select_related("submission")
            .order_by("created_at", "id")
            .first()
        )
        if not job:
            return None

        job.status = JudgeJob.Status.RUNNING
        job.attempt += 1
        job.claimed_by = worker_id
        job.lease_expires_at = _lease_expires_at(now)
        job.last_heartbeat_at = now
        if not job.started_at:
            job.started_at = now
        job.error = ""
        job.save(
            update_fields=[
                "status",
                "attempt",
                "claimed_by",
                "lease_expires_at",
                "last_heartbeat_at",
                "started_at",
                "error",
                "updated_at",
            ]
        )
        return {"job_id": job.id, "attempt": job.attempt, "worker_id": worker_id}


def _finish_claimed_job(
    *,
    job_id: int,
    attempt: int,
    worker_id: str,
    result=None,
    status: str = JudgeJob.Status.COMPLETED,
    error: str = "",
) -> bool:
    now = timezone.now()
    with transaction.atomic():
        try:
            job = (
                JudgeJob.objects.select_for_update()
                .select_related("submission__problem", "submission__user")
                .get(id=job_id)
            )
        except JudgeJob.DoesNotExist:
            return False

        if (
            job.status != JudgeJob.Status.RUNNING
            or job.attempt != attempt
            or job.claimed_by != worker_id
        ):
            return False

        if result:
            apply_judge_result_to_submission(job.submission, result)

        job.status = status
        job.finished_at = now
        job.lease_expires_at = None
        job.error = error or (result.error if result else "")
        job.save(
            update_fields=[
                "status",
                "finished_at",
                "lease_expires_at",
                "error",
                "updated_at",
            ]
        )
        return True


def heartbeat_judge_job(job_id: int, attempt: int, worker_id: str) -> bool:
    now = timezone.now()
    updated = JudgeJob.objects.filter(
        id=job_id,
        status=JudgeJob.Status.RUNNING,
        attempt=attempt,
        claimed_by=worker_id,
    ).update(
        lease_expires_at=_lease_expires_at(now),
        last_heartbeat_at=now,
        updated_at=now,
    )
    return updated == 1


def _heartbeat_until_stopped(
    stop_event: threading.Event,
    *,
    job_id: int,
    attempt: int,
    worker_id: str,
) -> None:
    close_old_connections()
    try:
        interval = judge_job_heartbeat_interval_seconds()
        while not stop_event.wait(interval):
            if not heartbeat_judge_job(job_id, attempt, worker_id):
                return
    finally:
        close_old_connections()


def _run_claimed_judge_job(
    job_id: int,
    attempt: int,
    worker_id: str,
    isolate_box_id: int,
):
    job = (
        JudgeJob.objects.select_related("submission__problem", "submission__user")
        .filter(id=job_id)
        .first()
    )
    if not job:
        return {"processed": False, "reason": "missing-job"}

    submission = job.submission
    if submission.verdict != "IQ":
        _finish_claimed_job(
            job_id=job_id,
            attempt=attempt,
            worker_id=worker_id,
            status=JudgeJob.Status.FAILED,
            error=f"Submission is not in queue: {submission.verdict}",
        )
        return {"processed": False, "reason": "submission-not-in-queue"}

    clear_submission_progress(submission.id)

    if settings.NO_ISOLATE:
        result = _judge_result(
            verdict="RE 1",
            time_ms=random.randint(0, int(submission.problem.time_limit * 1000)),
            memory_kb=random.randint(0, int(submission.problem.memory_limit * 1024)),
            error="NO_ISOLATE is enabled.",
        )
        logger.warning(
            "NO_ISOLATE is set to True. Skipping isolate execution for "
            f"submission {submission.id}."
        )
    else:
        try:
            from judge_engine import judge_submission

            result = judge_submission(
                build_judge_request_for_box(
                    submission,
                    isolate_box_id=isolate_box_id,
                ),
                progress_callback=publish_judge_progress,
            )
        except ModuleNotFoundError as exc:
            message = f"judge_engine is unavailable: {exc}"
            logger.error(message)
            result = _judge_result(verdict="RE 1", error=message)
            _finish_claimed_job(
                job_id=job_id,
                attempt=attempt,
                worker_id=worker_id,
                result=result,
                status=JudgeJob.Status.FAILED,
                error=message,
            )
            return {
                "processed": True,
                "verdict": result.verdict,
                "reason": "judge-engine-unavailable",
                "error": message,
            }
        if result.error:
            logger.error(f"Judge error for submission {submission.id}: {result.error}")

    finished = _finish_claimed_job(
        job_id=job_id,
        attempt=attempt,
        worker_id=worker_id,
        result=result,
    )
    return {"processed": finished, "verdict": result.verdict}


def process_judge_job(
    job_id: int,
    worker_id: str | None = None,
    isolate_box_id: int | None = None,
):
    claim = claim_judge_job(job_id, worker_id)
    if not claim:
        return {"processed": False, "reason": "not-claimed"}

    return process_claimed_judge_job(claim, isolate_box_id=isolate_box_id)


def process_claimed_judge_job(claim, *, isolate_box_id: int | None = None):
    box_id = isolate_box_id if isolate_box_id is not None else default_isolate_box_id()
    stop_heartbeat = threading.Event()
    heartbeat_thread = threading.Thread(
        target=_heartbeat_until_stopped,
        kwargs={
            "stop_event": stop_heartbeat,
            "job_id": claim["job_id"],
            "attempt": claim["attempt"],
            "worker_id": claim["worker_id"],
        },
        name=f"judge-job-heartbeat-{claim['job_id']}",
        daemon=True,
    )
    heartbeat_thread.start()
    try:
        return _run_claimed_judge_job(
            claim["job_id"],
            claim["attempt"],
            claim["worker_id"],
            box_id,
        )
    except Exception as exc:
        logger.error(f"Error while processing judge job {claim['job_id']}: {exc}")
        result = _judge_result(verdict="RE 1", error=str(exc))
        finished = _finish_claimed_job(
            job_id=claim["job_id"],
            attempt=claim["attempt"],
            worker_id=claim["worker_id"],
            result=result,
            status=JudgeJob.Status.FAILED,
            error=str(exc),
        )
        return {"processed": finished, "verdict": result.verdict, "error": str(exc)}
    finally:
        stop_heartbeat.set()
        heartbeat_thread.join(timeout=1)


def process_next_judge_job(
    worker_id: str | None = None,
    isolate_box_id: int | None = None,
):
    claim = claim_next_judge_job(worker_id)
    if not claim:
        return {"processed": False, "reason": "no-job"}
    return process_claimed_judge_job(claim, isolate_box_id=isolate_box_id)


def _chunks(items: list[int], size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def queue_retest_submissions(submission_ids: list[int]):
    if not submission_ids:
        return {"queued": 0}

    ids = [
        int(i)
        for i in submission_ids
        if isinstance(i, int) or (isinstance(i, str) and i.isdigit())
    ]
    if not ids:
        return {"queued": 0}

    now = timezone.now()
    queued = 0
    for batch in _chunks(ids, 500):
        with transaction.atomic():
            candidates = list(
                _select_for_update(Submission.objects)
                .filter(id__in=batch)
                .exclude(verdict="IQ")
                .values_list("id", flat=True)
            )
            if not candidates:
                continue

            active_submission_ids = set(
                JudgeJob.objects.filter(
                    submission_id__in=candidates,
                    status__in=ACTIVE_JOB_STATUSES,
                ).values_list("submission_id", flat=True)
            )
            to_queue = [
                submission_id
                for submission_id in candidates
                if submission_id not in active_submission_ids
            ]
            if not to_queue:
                continue

            Submission.objects.filter(id__in=to_queue).update(
                verdict="IQ", time=0, memory=0, updated_at=now
            )

            created_submission_ids = []
            for submission_id in to_queue:
                try:
                    with transaction.atomic():
                        JudgeJob.objects.create(submission_id=submission_id)
                except IntegrityError:
                    continue
                created_submission_ids.append(submission_id)

        for submission_id in created_submission_ids:
            clear_submission_progress(submission_id)
            queued += 1

    return {"queued": queued}


def queue_retest_all_submissions(*, limit: int | None = None):
    queryset = Submission.objects.exclude(verdict="IQ").order_by("id")
    if limit is not None:
        limit = max(0, int(limit))
        queryset = queryset[:limit]
    ids = list(queryset.values_list("id", flat=True))
    result = queue_retest_submissions(ids)
    if limit is not None:
        result["remaining"] = Submission.objects.exclude(verdict="IQ").count()
    return result
