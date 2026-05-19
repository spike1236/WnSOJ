from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import TestCase, override_settings

from problemset.tests.helpers import create_problem, create_submission, create_user
from problemset.tests.helpers import write_problem_test
from problemset.utils import parse_meta_file, run_tests


class ParseMetaFileTests(TestCase):
    def test_parse_meta_file_converts_numeric_values(self):
        with TemporaryDirectory() as tmp:
            path = Path(tmp) / "meta.txt"
            path.write_text("time:0.125\nmax-rss:4096\nstatus:RE\n")

            result = parse_meta_file(path)

        self.assertEqual(result["time"], 0.125)
        self.assertEqual(result["max-rss"], 4096)
        self.assertEqual(result["status"], "RE")

    def test_parse_meta_file_missing_file_returns_empty_dict(self):
        self.assertEqual(parse_meta_file("/missing/meta.txt"), {})


class RunTestsTests(TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.override = override_settings(PROBLEMS_DATA_ROOT=Path(self.tmp.name))
        self.override.enable()
        self.addCleanup(self.override.disable)

        self.user = create_user()
        self.problem = create_problem(time_limit=1.0, memory_limit=64)
        self.submission = create_submission(self.user, self.problem)
        self.config = {"run": ["./program"]}

    def run_problem_tests(self, result):
        with patch("problemset.utils.publish_submission_event"), patch(
            "problemset.utils.publish_submission_final"
        ), patch("problemset.utils.run_isolate", return_value=result):
            run_tests(
                box_id=1,
                config=self.config,
                problem_id=self.problem.id,
                time_limit=self.problem.time_limit,
                mem_limit=self.problem.memory_limit * 1024,
                submission=self.submission,
            )
        self.submission.refresh_from_db()
        return self.submission

    def test_run_tests_marks_accepted_and_updates_solved_set(self):
        write_problem_test(self.tmp.name, self.problem.id, "01.txt", "1 2\n", "3\n")

        submission = self.run_problem_tests(
            {"stdout": "3\n", "run_success": True, "time": 0.012, "max-rss": 1024}
        )

        self.assertEqual(submission.verdict, "AC")
        self.assertEqual(submission.time, 12)
        self.assertEqual(submission.memory, 1024)
        self.assertIn(self.problem, self.user.problems_solved.all())
        self.assertNotIn(self.problem, self.user.problems_unsolved.all())

    def test_run_tests_marks_wrong_answer_and_updates_unsolved_set(self):
        write_problem_test(self.tmp.name, self.problem.id, "01.txt", "1 2\n", "3\n")

        submission = self.run_problem_tests(
            {"stdout": "4\n", "run_success": True, "time": 0.01, "max-rss": 512}
        )

        self.assertEqual(submission.verdict, "WA 1")
        self.assertIn(self.problem, self.user.problems_unsolved.all())
        self.assertNotIn(self.problem, self.user.problems_solved.all())

    def test_run_tests_marks_timeout(self):
        write_problem_test(self.tmp.name, self.problem.id, "01.txt", "1 2\n", "3\n")

        submission = self.run_problem_tests(
            {"stdout": "", "run_success": False, "status": "TO", "max-rss": 512}
        )

        self.assertEqual(submission.verdict, "TLE 1")
        self.assertEqual(submission.time, 1000)

    def test_run_tests_marks_memory_limit_exceeded(self):
        write_problem_test(self.tmp.name, self.problem.id, "01.txt", "1 2\n", "3\n")
        mem_limit = self.problem.memory_limit * 1024

        submission = self.run_problem_tests(
            {"stdout": "", "run_success": False, "status": "SG", "max-rss": mem_limit}
        )

        self.assertEqual(submission.verdict, "MLE 1")
        self.assertEqual(submission.memory, mem_limit)

    def test_run_tests_marks_runtime_error(self):
        write_problem_test(self.tmp.name, self.problem.id, "01.txt", "1 2\n", "3\n")

        submission = self.run_problem_tests(
            {"stdout": "", "run_success": False, "status": "RE", "max-rss": 512}
        )

        self.assertEqual(submission.verdict, "RE 1")

    def test_run_tests_missing_test_directories_marks_runtime_error(self):
        with patch("problemset.utils.publish_submission_final"):
            run_tests(
                box_id=1,
                config=self.config,
                problem_id=self.problem.id,
                time_limit=self.problem.time_limit,
                mem_limit=self.problem.memory_limit * 1024,
                submission=self.submission,
            )

        self.submission.refresh_from_db()
        self.assertEqual(self.submission.verdict, "RE 1")
