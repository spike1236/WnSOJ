from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import SimpleTestCase, TestCase

from judge_engine import JudgeResult, LanguageConfig, RunResult, run_test_cases
from judge_engine.isolate import parse_meta_file
from problemset.tests.helpers import create_problem, create_submission, create_user
from problemset.utils import apply_judge_result_to_submission


def write_test(root, filename, input_data, output_data):
    tests_root = Path(root) / "tests"
    input_dir = tests_root / "input"
    output_dir = tests_root / "output"
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    (input_dir / filename).write_text(input_data)
    (output_dir / filename).write_text(output_data)
    return tests_root


class ParseMetaFileTests(SimpleTestCase):
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


class RunTestCasesTests(SimpleTestCase):
    def setUp(self):
        self.config = LanguageConfig(source_file="source.py", run=("./program",))

    def run_problem_tests(self, result):
        with TemporaryDirectory() as tmp:
            tests_root = write_test(tmp, "01.txt", "1 2\n", "3\n")

            def run_command(box_id, cmd, time_limit, memory_limit, input_data):
                return result

            return run_test_cases(
                submission_id=1,
                box_id=1,
                config=self.config,
                tests_root=tests_root,
                time_limit_seconds=1.0,
                memory_limit_kb=64 * 1024,
                run_command=run_command,
            )

    def test_run_test_cases_marks_accepted(self):
        result = self.run_problem_tests(
            RunResult(
                stdout="3\n",
                run_success=True,
                time_seconds=0.012,
                memory_kb=1024,
            )
        )

        self.assertEqual(result.verdict, "AC")
        self.assertEqual(result.time_ms, 12)
        self.assertEqual(result.memory_kb, 1024)

    def test_run_test_cases_marks_wrong_answer(self):
        result = self.run_problem_tests(
            RunResult(stdout="4\n", run_success=True, time_seconds=0.01, memory_kb=512)
        )

        self.assertEqual(result.verdict, "WA 1")

    def test_run_test_cases_marks_timeout(self):
        result = self.run_problem_tests(
            RunResult(stdout="", run_success=False, status="TO", memory_kb=512)
        )

        self.assertEqual(result.verdict, "TLE 1")
        self.assertEqual(result.time_ms, 1000)

    def test_run_test_cases_marks_memory_limit_exceeded(self):
        result = self.run_problem_tests(
            RunResult(
                stdout="",
                run_success=False,
                status="SG",
                memory_kb=64 * 1024,
            )
        )

        self.assertEqual(result.verdict, "MLE 1")
        self.assertEqual(result.memory_kb, 64 * 1024)

    def test_run_test_cases_marks_runtime_error(self):
        result = self.run_problem_tests(
            RunResult(stdout="", run_success=False, status="RE", memory_kb=512)
        )

        self.assertEqual(result.verdict, "RE 1")

    def test_run_test_cases_missing_test_directories_marks_runtime_error(self):
        with TemporaryDirectory() as tmp:
            result = run_test_cases(
                submission_id=1,
                box_id=1,
                config=self.config,
                tests_root=Path(tmp) / "tests",
                time_limit_seconds=1.0,
                memory_limit_kb=64 * 1024,
                run_command=lambda box_id, cmd, time_limit, memory_limit, input_data: (
                    RunResult(stdout="", run_success=True)
                ),
            )

        self.assertEqual(result.verdict, "RE 1")

    def test_run_test_cases_emits_progress(self):
        events = []
        with TemporaryDirectory() as tmp:
            tests_root = write_test(tmp, "01.txt", "1 2\n", "3\n")

            result = run_test_cases(
                submission_id=99,
                box_id=1,
                config=self.config,
                tests_root=tests_root,
                time_limit_seconds=1.0,
                memory_limit_kb=64 * 1024,
                run_command=lambda box_id, cmd, time_limit, memory_limit, input_data: (
                    RunResult(stdout="3\n", run_success=True)
                ),
                progress_callback=events.append,
            )

        self.assertEqual(result.verdict, "AC")
        self.assertEqual(events[0].submission_id, 99)
        self.assertEqual(events[0].verdict, "T 1")


class ApplyJudgeResultTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.problem = create_problem(time_limit=1.0, memory_limit=64)
        self.submission = create_submission(self.user, self.problem)

    def apply_result(self, result):
        with patch("problemset.utils.publish_submission_final"):
            with self.captureOnCommitCallbacks(execute=True):
                apply_judge_result_to_submission(self.submission, result)
        self.submission.refresh_from_db()
        return self.submission

    def test_apply_judge_result_marks_accepted_and_updates_solved_set(self):
        submission = self.apply_result(
            JudgeResult(verdict="AC", time_ms=12, memory_kb=1024)
        )

        self.assertEqual(submission.verdict, "AC")
        self.assertEqual(submission.time, 12)
        self.assertEqual(submission.memory, 1024)
        self.assertIn(self.problem, self.user.problems_solved.all())
        self.assertNotIn(self.problem, self.user.problems_unsolved.all())

    def test_apply_judge_result_marks_unsolved_on_wrong_answer(self):
        submission = self.apply_result(JudgeResult(verdict="WA 1"))

        self.assertEqual(submission.verdict, "WA 1")
        self.assertIn(self.problem, self.user.problems_unsolved.all())
        self.assertNotIn(self.problem, self.user.problems_solved.all())

    def test_apply_judge_result_publishes_final_on_commit(self):
        with patch("problemset.utils.publish_submission_final") as publish_final:
            with self.captureOnCommitCallbacks(execute=False) as callbacks:
                apply_judge_result_to_submission(
                    self.submission,
                    JudgeResult(verdict="AC", time_ms=12, memory_kb=1024),
                )

            publish_final.assert_not_called()
            self.assertEqual(len(callbacks), 1)
            callbacks[0]()
            publish_final.assert_called_once()
