import time
from datetime import timedelta
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.db import IntegrityError, transaction
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone

from judge_engine import JudgeResult
from problemset.models import JudgeJob, Submission
from problemset.tasks import (
    IsolateBoxLockError,
    acquire_isolate_box_lock,
    claim_next_judge_job,
    claim_judge_job,
    process_next_judge_job,
    process_judge_job,
    queue_retest_all_submissions,
    queue_retest_submissions,
    queue_submission_for_judging,
    release_isolate_box_lock,
)
from problemset.tests.helpers import create_problem, create_submission, create_user


class TestSubmissionTaskTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.problem = create_problem(time_limit=1.0, memory_limit=64)

    def test_task_ignores_submission_that_is_not_in_queue(self):
        submission = create_submission(self.user, self.problem, verdict="AC")

        job = queue_submission_for_judging(submission.id)

        submission.refresh_from_db()
        self.assertIsNone(job)
        self.assertEqual(submission.verdict, "AC")
        self.assertEqual(JudgeJob.objects.count(), 0)

    @override_settings(NO_ISOLATE=True)
    def test_no_isolate_mode_marks_submission_without_running_isolate(self):
        submission = create_submission(self.user, self.problem)
        job = queue_submission_for_judging(submission.id)

        with patch("problemset.tasks.random.randint", side_effect=[123, 456]), patch(
            "problemset.tasks.clear_submission_progress"
        ) as clear_progress, patch(
            "problemset.utils.publish_submission_final"
        ) as publish_final:
            with self.captureOnCommitCallbacks(execute=True):
                result = process_judge_job(job.id)

        submission.refresh_from_db()
        job.refresh_from_db()
        self.assertEqual(result["verdict"], "RE 1")
        self.assertEqual(job.status, JudgeJob.Status.COMPLETED)
        self.assertEqual(job.attempt, 1)
        self.assertEqual(submission.verdict, "RE 1")
        self.assertEqual(submission.time, 123)
        self.assertEqual(submission.memory, 456)
        clear_progress.assert_called_once_with(submission.id)
        publish_final.assert_called_once()

    @override_settings(NO_ISOLATE=False)
    def test_unknown_language_marks_runtime_error(self):
        submission = create_submission(self.user, self.problem, language="ruby")
        job = queue_submission_for_judging(submission.id)

        with patch("problemset.tasks.clear_submission_progress"), patch(
            "problemset.utils.publish_submission_final"
        ) as publish_final, patch(
            "problemset.tasks.logger.error"
        ):
            with self.captureOnCommitCallbacks(execute=True):
                result = process_judge_job(job.id)

        submission.refresh_from_db()
        job.refresh_from_db()
        self.assertEqual(result["verdict"], "RE 1")
        self.assertEqual(job.status, JudgeJob.Status.COMPLETED)
        self.assertIn("Unknown language", job.error)
        self.assertEqual(submission.verdict, "RE 1")
        self.assertEqual(submission.time, 0)
        self.assertEqual(submission.memory, 0)
        publish_final.assert_called_once()

    def test_queue_submission_creates_queued_db_job(self):
        submission = create_submission(self.user, self.problem)

        job = queue_submission_for_judging(submission.id)

        self.assertIsNotNone(job)
        job.refresh_from_db()
        self.assertEqual(job.status, JudgeJob.Status.QUEUED)
        self.assertEqual(JudgeJob.objects.count(), 1)


class JudgeJobClaimTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.problem = create_problem()
        self.submission = create_submission(self.user, self.problem)

    def test_claim_judge_job_assigns_worker_and_lease(self):
        job = JudgeJob.objects.create(submission=self.submission)

        claim = claim_judge_job(job.id, worker_id="worker-a")

        self.assertEqual(claim["attempt"], 1)
        job.refresh_from_db()
        self.assertEqual(job.status, JudgeJob.Status.RUNNING)
        self.assertEqual(job.claimed_by, "worker-a")
        self.assertIsNotNone(job.lease_expires_at)

    def test_claim_judge_job_respects_active_lease(self):
        job = JudgeJob.objects.create(
            submission=self.submission,
            status=JudgeJob.Status.RUNNING,
            attempt=1,
            claimed_by="worker-a",
            lease_expires_at=timezone.now() + timedelta(minutes=5),
        )

        claim = claim_judge_job(job.id, worker_id="worker-b")

        self.assertIsNone(claim)

    def test_active_job_constraint_prevents_duplicate_active_jobs(self):
        JudgeJob.objects.create(submission=self.submission)

        with self.assertRaises(IntegrityError), transaction.atomic():
            JudgeJob.objects.create(submission=self.submission)

    @override_settings(NO_ISOLATE=False)
    def test_process_judge_job_persists_result_for_claimed_attempt(self):
        job = JudgeJob.objects.create(submission=self.submission)

        with patch(
            "judge_engine.judge_submission",
            return_value=JudgeResult(verdict="AC", time_ms=10, memory_kb=20),
        ), patch("problemset.utils.publish_submission_final"):
            result = process_judge_job(job.id, worker_id="worker-a")

        self.assertEqual(result, {"processed": True, "verdict": "AC"})
        job.refresh_from_db()
        self.submission.refresh_from_db()
        self.assertEqual(job.status, JudgeJob.Status.COMPLETED)
        self.assertEqual(job.attempt, 1)
        self.assertEqual(job.claimed_by, "worker-a")
        self.assertEqual(self.submission.verdict, "AC")
        self.assertEqual(self.submission.time, 10)
        self.assertEqual(self.submission.memory, 20)

    def test_claim_next_judge_job_claims_oldest_queued_job(self):
        first = JudgeJob.objects.create(submission=self.submission)
        other_submission = create_submission(self.user, self.problem)
        JudgeJob.objects.create(submission=other_submission)

        claim = claim_next_judge_job(worker_id="worker-a")

        self.assertEqual(claim["job_id"], first.id)
        first.refresh_from_db()
        self.assertEqual(first.status, JudgeJob.Status.RUNNING)
        self.assertEqual(first.claimed_by, "worker-a")

    def test_claim_next_judge_job_reclaims_expired_lease(self):
        job = JudgeJob.objects.create(
            submission=self.submission,
            status=JudgeJob.Status.RUNNING,
            attempt=1,
            claimed_by="dead-worker",
            lease_expires_at=timezone.now() - timedelta(seconds=1),
        )

        claim = claim_next_judge_job(worker_id="worker-b")

        self.assertEqual(claim["job_id"], job.id)
        self.assertEqual(claim["attempt"], 2)
        job.refresh_from_db()
        self.assertEqual(job.claimed_by, "worker-b")

    @override_settings(NO_ISOLATE=False)
    def test_process_next_judge_job_processes_claimed_db_job(self):
        job = JudgeJob.objects.create(submission=self.submission)
        seen_box_ids = []

        def fake_build_request(submission, *, isolate_box_id):
            seen_box_ids.append(isolate_box_id)
            return object()

        with patch(
            "judge_engine.judge_submission",
            return_value=JudgeResult(verdict="AC", time_ms=10, memory_kb=20),
        ), patch(
            "problemset.tasks.build_judge_request_for_box",
            side_effect=fake_build_request,
        ), patch("problemset.utils.publish_submission_final"):
            result = process_next_judge_job(worker_id="worker-a", isolate_box_id=7)

        self.assertEqual(result, {"processed": True, "verdict": "AC"})
        self.assertEqual(seen_box_ids, [7])
        job.refresh_from_db()
        self.submission.refresh_from_db()
        self.assertEqual(job.status, JudgeJob.Status.COMPLETED)
        self.assertEqual(self.submission.verdict, "AC")

    @override_settings(NO_ISOLATE=False)
    def test_engine_unavailable_fails_job_with_final_submission_verdict(self):
        job = JudgeJob.objects.create(submission=self.submission)

        with patch("problemset.utils.publish_submission_final") as publish_final, patch(
            "problemset.tasks.build_judge_request_for_box",
            side_effect=ModuleNotFoundError("No module named 'judge_engine'"),
        ):
            with self.captureOnCommitCallbacks(execute=True):
                result = process_judge_job(job.id, worker_id="worker-a")

        job.refresh_from_db()
        self.submission.refresh_from_db()
        self.assertTrue(result["processed"])
        self.assertEqual(result["verdict"], "RE 1")
        self.assertEqual(result["reason"], "judge-engine-unavailable")
        self.assertEqual(job.status, JudgeJob.Status.FAILED)
        self.assertIn("judge_engine is unavailable", job.error)
        self.assertEqual(self.submission.verdict, "RE 1")
        publish_final.assert_called_once()


class JudgeJobHeartbeatTests(TransactionTestCase):
    def setUp(self):
        self.user = create_user()
        self.problem = create_problem()
        self.submission = create_submission(self.user, self.problem)

    @override_settings(
        NO_ISOLATE=False,
        JUDGE_JOB_LEASE_SECONDS=0.05,
        JUDGE_JOB_HEARTBEAT_INTERVAL_SECONDS=0.01,
    )
    def test_heartbeat_prevents_long_running_job_from_being_reclaimed(self):
        job = JudgeJob.objects.create(submission=self.submission)
        attempted_claims = []

        def long_running_judge(request, progress_callback=None):
            time.sleep(0.12)
            attempted_claims.append(claim_next_judge_job(worker_id="worker-b"))
            return JudgeResult(verdict="AC", time_ms=10, memory_kb=20)

        with patch(
            "judge_engine.judge_submission",
            side_effect=long_running_judge,
        ), patch("problemset.utils.publish_submission_final"):
            result = process_judge_job(job.id, worker_id="worker-a")

        job.refresh_from_db()
        self.submission.refresh_from_db()
        self.assertEqual(attempted_claims, [None])
        self.assertEqual(result, {"processed": True, "verdict": "AC"})
        self.assertEqual(job.attempt, 1)
        self.assertEqual(job.status, JudgeJob.Status.COMPLETED)
        self.assertEqual(self.submission.verdict, "AC")


class RetestSubmissionsTaskTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.problem = create_problem()

    def test_retest_submissions_requeues_judged_submissions(self):
        first = create_submission(self.user, self.problem, verdict="AC", time=10)
        second = create_submission(self.user, self.problem, verdict="WA 1", memory=20)
        queued = create_submission(self.user, self.problem, verdict="IQ")

        with patch("problemset.tasks.clear_submission_progress") as clear_progress:
            result = queue_retest_submissions([first.id, second.id, queued.id])

        self.assertEqual(result, {"queued": 2})
        self.assertEqual(
            list(
                Submission.objects.filter(id__in=[first.id, second.id]).values_list(
                    "verdict", "time", "memory"
                )
            ),
            [("IQ", 0, 0), ("IQ", 0, 0)],
        )
        jobs = list(JudgeJob.objects.order_by("id"))
        self.assertEqual(len(jobs), 2)
        self.assertEqual(clear_progress.call_count, 2)

    def test_retest_submissions_skips_submission_with_active_job(self):
        submission = create_submission(self.user, self.problem, verdict="WA 1")
        JudgeJob.objects.create(submission=submission, status=JudgeJob.Status.QUEUED)

        with patch("problemset.tasks.clear_submission_progress") as clear_progress:
            result = queue_retest_submissions([submission.id])

        self.assertEqual(result, {"queued": 0})
        self.assertEqual(JudgeJob.objects.filter(submission=submission).count(), 1)
        clear_progress.assert_not_called()

    def test_retest_all_respects_limit(self):
        first = create_submission(self.user, self.problem, verdict="AC")
        second = create_submission(self.user, self.problem, verdict="WA 1")

        with patch("problemset.tasks.clear_submission_progress"):
            result = queue_retest_all_submissions(limit=1)

        self.assertEqual(result, {"queued": 1, "remaining": 1})
        self.assertEqual(JudgeJob.objects.count(), 1)
        self.assertEqual(
            Submission.objects.get(id=first.id).verdict,
            "IQ",
        )
        self.assertEqual(
            Submission.objects.get(id=second.id).verdict,
            "WA 1",
        )


class SubmissionAdminRetestTests(TestCase):
    def setUp(self):
        self.admin_user = create_user("admin", is_staff=True)
        self.user = create_user()
        self.problem = create_problem()

    @override_settings(JUDGE_ADMIN_RETEST_BATCH_SIZE=1)
    def test_selected_retest_action_queues_bounded_batch(self):
        first = create_submission(self.user, self.problem, verdict="AC")
        second = create_submission(self.user, self.problem, verdict="WA 1")
        self.client.force_login(self.admin_user)

        response = self.client.post(
            "/admin/problemset/submission/",
            {
                "action": "retest_selected_submissions",
                "_selected_action": [str(first.id), str(second.id)],
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(JudgeJob.objects.count(), 1)
        self.assertEqual(Submission.objects.get(id=first.id).verdict, "IQ")
        self.assertEqual(Submission.objects.get(id=second.id).verdict, "WA 1")


class IsolateBoxLockTests(TestCase):
    def test_duplicate_live_box_lock_raises(self):
        with TemporaryDirectory() as tmp:
            with override_settings(JUDGE_ISOLATE_LOCK_DIR=tmp):
                lock_path = acquire_isolate_box_lock(7, "worker-a")
                try:
                    with self.assertRaises(IsolateBoxLockError):
                        acquire_isolate_box_lock(7, "worker-b")
                finally:
                    release_isolate_box_lock(lock_path)

    def test_stale_box_lock_is_reclaimed(self):
        with TemporaryDirectory() as tmp:
            with override_settings(JUDGE_ISOLATE_LOCK_DIR=tmp):
                lock_path = acquire_isolate_box_lock(7, "worker-a")
                lock_path.write_text("pid=99999999\nworker_id=dead\nbox_id=7\n")

                reclaimed = acquire_isolate_box_lock(7, "worker-b")

                try:
                    self.assertEqual(reclaimed, lock_path)
                    self.assertIn("worker-b", reclaimed.read_text())
                finally:
                    release_isolate_box_lock(reclaimed)

    def test_release_does_not_remove_lock_owned_by_another_pid(self):
        with TemporaryDirectory() as tmp:
            with override_settings(JUDGE_ISOLATE_LOCK_DIR=tmp):
                lock_path = acquire_isolate_box_lock(7, "worker-a")
                lock_path.write_text("pid=99999999\nworker_id=other\nbox_id=7\n")

                release_isolate_box_lock(lock_path)

                try:
                    self.assertTrue(lock_path.exists())
                finally:
                    lock_path.unlink(missing_ok=True)
