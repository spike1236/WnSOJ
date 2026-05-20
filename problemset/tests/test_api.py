from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.test import TestCase, override_settings

from problemset.models import Problem, Submission
from problemset.tests.helpers import (
    create_category,
    create_problem,
    create_user,
    make_problem_zip,
)

TEST_API_KEY = "test-internal-api-key"


@override_settings(INTERNAL_API_KEY=TEST_API_KEY)
class ProblemAPIPermissionTests(TestCase):
    def setUp(self):
        self.client.defaults["HTTP_X_INTERNAL_API_KEY"] = TEST_API_KEY
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.override = override_settings(PROBLEMS_DATA_ROOT=Path(self.tmp.name))
        self.override.enable()
        self.addCleanup(self.override.disable)

        self.problemset = create_category("problemset", "Problemset")
        self.category = create_category()

    def test_anonymous_user_can_list_problems(self):
        problem = create_problem()
        problem.categories.add(self.problemset)

        response = self.client.get("/api/problems/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["title"], "A + B")

    def test_normal_user_cannot_create_problem(self):
        user = create_user()
        self.client.force_login(user)

        response = self.client.post(
            "/api/problems/",
            {
                "title": "New Problem",
                "time_limit": "1",
                "memory_limit": "64",
                "statement": "Statement",
                "editorial": "Editorial",
                "code": "solution",
                "categories": [self.category.id],
                "test_data": make_problem_zip(),
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Problem.objects.count(), 0)

    def test_staff_user_can_create_problem_with_test_zip(self):
        staff = create_user("staff", is_staff=True)
        self.client.force_login(staff)

        response = self.client.post(
            "/api/problems/",
            {
                "title": "New Problem",
                "time_limit": "1",
                "memory_limit": "64",
                "statement": "Statement",
                "editorial": "Editorial",
                "code": "solution",
                "categories": [self.category.id],
                "test_data": make_problem_zip(),
            },
        )

        self.assertEqual(response.status_code, 201)
        problem = Problem.objects.get(title="New Problem")
        self.assertTrue(
            Path(self.tmp.name, str(problem.id), "tests", "input", "01.txt").exists()
        )
        self.assertEqual(
            set(problem.categories.values_list("short_name", flat=True)),
            {"arrays", "problemset"},
        )

    def test_staff_problem_create_rejects_incomplete_test_zip(self):
        staff = create_user("staff", is_staff=True)
        self.client.force_login(staff)

        response = self.client.post(
            "/api/problems/",
            {
                "title": "Broken Problem",
                "time_limit": "1",
                "memory_limit": "64",
                "statement": "Statement",
                "editorial": "Editorial",
                "code": "solution",
                "categories": [self.category.id],
                "test_data": make_problem_zip({"tests/input/01.txt": "1 2\n"}),
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Problem.objects.count(), 0)


@override_settings(INTERNAL_API_KEY=TEST_API_KEY)
class SubmissionAPITests(TestCase):
    def setUp(self):
        self.client.defaults["HTTP_X_INTERNAL_API_KEY"] = TEST_API_KEY
        self.user = create_user()
        self.problem = create_problem()

    def test_authenticated_user_can_create_submission_for_self(self):
        self.client.force_login(self.user)

        with patch("problemset.tasks.test_submission_task.delay") as delay:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(
                    "/api/submissions/",
                    {
                        "problem_id": self.problem.id,
                        "language": "py",
                        "code": "print(42)",
                    },
                )

        self.assertEqual(response.status_code, 201)
        submission = Submission.objects.get()
        self.assertEqual(submission.user, self.user)
        self.assertEqual(submission.problem, self.problem)
        self.assertEqual(submission.verdict, "IQ")
        delay.assert_called_once_with(submission.id)

    def test_submission_status_endpoint_returns_parsed_verdict(self):
        submission = Submission.objects.create(
            user=self.user,
            problem=self.problem,
            language="py",
            code="print(42)",
            verdict="WA 3",
            time=12,
            memory=256,
        )

        response = self.client.get(f"/api/submissions/{submission.id}/status/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["verdict_code"], "WA")
        self.assertEqual(response.json()["verdict_testcase"], 3)
        self.assertEqual(response.json()["verdict_display"], "WA #3")


@override_settings(INTERNAL_API_KEY="secret")
class InternalAPIKeyMiddlewareTests(TestCase):
    def test_api_request_without_internal_key_returns_not_found(self):
        response = self.client.get("/api/categories/")

        self.assertEqual(response.status_code, 404)

    def test_api_request_with_wrong_internal_key_returns_not_found(self):
        response = self.client.get(
            "/api/categories/", HTTP_X_INTERNAL_API_KEY="wrong"
        )

        self.assertEqual(response.status_code, 404)

    def test_api_request_with_internal_key_is_allowed(self):
        response = self.client.get(
            "/api/categories/", HTTP_X_INTERNAL_API_KEY="secret"
        )

        self.assertEqual(response.status_code, 200)


@override_settings(DEBUG=False, INTERNAL_API_KEY="")
class InternalAPIKeyMissingConfigTests(TestCase):
    def test_api_request_without_configured_key_returns_not_found(self):
        response = self.client.get("/api/categories/")

        self.assertEqual(response.status_code, 404)
