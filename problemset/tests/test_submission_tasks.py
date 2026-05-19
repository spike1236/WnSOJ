from unittest.mock import patch

from django.test import TestCase, override_settings

from problemset.models import Submission
from problemset.tasks import retest_submissions_task, test_submission_task
from problemset.tests.helpers import create_problem, create_submission, create_user


class TestSubmissionTaskTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.problem = create_problem(time_limit=1.0, memory_limit=64)

    def test_task_ignores_submission_that_is_not_in_queue(self):
        submission = create_submission(self.user, self.problem, verdict="AC")

        with patch("problemset.tasks.clear_submission_progress") as clear_progress:
            test_submission_task(submission.id)

        submission.refresh_from_db()
        self.assertEqual(submission.verdict, "AC")
        clear_progress.assert_not_called()

    @override_settings(NO_ISOLATE=True)
    def test_no_isolate_mode_marks_submission_without_running_isolate(self):
        submission = create_submission(self.user, self.problem)

        with patch("problemset.tasks.random.randint", side_effect=[123, 456]), patch(
            "problemset.tasks.clear_submission_progress"
        ) as clear_progress, patch(
            "problemset.tasks.publish_submission_final"
        ) as publish_final:
            test_submission_task(submission.id)

        submission.refresh_from_db()
        self.assertEqual(submission.verdict, "RE 1")
        self.assertEqual(submission.time, 123)
        self.assertEqual(submission.memory, 456)
        clear_progress.assert_called_once_with(submission.id)
        publish_final.assert_called_once()

    @override_settings(NO_ISOLATE=False)
    def test_unknown_language_marks_runtime_error(self):
        submission = create_submission(self.user, self.problem, language="ruby")

        with patch("problemset.tasks.clear_submission_progress"), patch(
            "problemset.tasks.publish_submission_final"
        ) as publish_final:
            test_submission_task(submission.id)

        submission.refresh_from_db()
        self.assertEqual(submission.verdict, "RE 1")
        self.assertEqual(submission.time, 0)
        self.assertEqual(submission.memory, 0)
        publish_final.assert_called_once()


class RetestSubmissionsTaskTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.problem = create_problem()

    def test_retest_submissions_requeues_judged_submissions(self):
        first = create_submission(self.user, self.problem, verdict="AC", time=10)
        second = create_submission(self.user, self.problem, verdict="WA 1", memory=20)
        queued = create_submission(self.user, self.problem, verdict="IQ")

        with patch("problemset.tasks.clear_submission_progress") as clear_progress:
            with patch("problemset.tasks.test_submission_task.delay") as delay:
                result = retest_submissions_task([first.id, second.id, queued.id])

        self.assertEqual(result, {"queued": 2})
        self.assertEqual(
            list(
                Submission.objects.filter(id__in=[first.id, second.id]).values_list(
                    "verdict", "time", "memory"
                )
            ),
            [("IQ", 0, 0), ("IQ", 0, 0)],
        )
        self.assertEqual(delay.call_count, 2)
        self.assertEqual(clear_progress.call_count, 2)
