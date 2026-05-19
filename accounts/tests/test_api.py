import json

from django.test import TestCase, override_settings

from accounts.models import User
from accounts.tests.helpers import create_user
from problemset.models import Problem, Submission


@override_settings(INTERNAL_API_KEY="")
class SessionAccountAPITests(TestCase):
    def test_session_register_creates_and_logs_in_user(self):
        response = self.client.post(
            "/api/session/register/",
            {
                "username": "newuser",
                "email": "new@example.com",
                "password": "ComplexPass12345!",
                "password2": "ComplexPass12345!",
                "is_business": True,
            },
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="newuser")
        self.assertEqual(user.account_type, 2)
        self.assertTrue(user.check_password("ComplexPass12345!"))
        self.assertEqual(int(self.client.session["_auth_user_id"]), user.id)

    def test_session_login_rejects_invalid_credentials(self):
        create_user("alice", password="correct-password")

        response = self.client.post(
            "/api/session/login/",
            data=json.dumps({"username": "alice", "password": "wrong-password"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Invalid username or password.")

    def test_profile_endpoint_requires_authentication(self):
        response = self.client.get("/api/profile/")

        self.assertEqual(response.status_code, 403)

    def test_profile_endpoint_returns_and_updates_current_user(self):
        user = create_user("profile")
        self.client.force_login(user)

        get_response = self.client.get("/api/profile/")
        patch_response = self.client.patch(
            "/api/profile/",
            {
                "username": "profile2",
                "email": "profile2@example.com",
                "phone_number": "555-0100",
                "is_business": True,
            },
            content_type="application/json",
        )

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response.json()["username"], "profile")
        self.assertEqual(patch_response.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.username, "profile2")
        self.assertEqual(user.email, "profile2@example.com")
        self.assertEqual(user.phone_number, "555-0100")
        self.assertEqual(user.account_type, 2)

    def test_password_endpoint_changes_password_and_keeps_session(self):
        user = create_user("password-user", password="old-password")
        self.client.force_login(user)

        response = self.client.post(
            "/api/profile/password/",
            {
                "old_password": "old-password",
                "new_password1": "new-password",
                "new_password2": "new-password",
            },
        )

        self.assertEqual(response.status_code, 204)
        user.refresh_from_db()
        self.assertTrue(user.check_password("new-password"))
        self.assertEqual(self.client.get("/api/profile/").status_code, 200)

    def test_password_endpoint_rejects_wrong_old_password(self):
        user = create_user("password-user", password="old-password")
        self.client.force_login(user)

        response = self.client.post(
            "/api/profile/password/",
            {
                "old_password": "wrong-password",
                "new_password1": "new-password",
                "new_password2": "new-password",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Invalid old password.")

    def test_icon_endpoint_requires_file(self):
        self.client.force_login(create_user("icon-user"))

        response = self.client.post("/api/profile/icon/", {})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Missing icon file.")


@override_settings(INTERNAL_API_KEY="")
class PublicProfileAPITests(TestCase):
    def test_public_profile_returns_verdict_counts_and_recent_submissions(self):
        user = create_user("solver")
        problem = Problem.objects.create(
            title="A + B",
            time_limit=1,
            memory_limit=64,
            statement="Statement",
            editorial="Editorial",
        )
        Submission.objects.create(
            user=user,
            problem=problem,
            language="py",
            code="print(1)",
            verdict="AC",
        )
        Submission.objects.create(
            user=user,
            problem=problem,
            language="py",
            code="print(2)",
            verdict="WA 1",
        )
        Submission.objects.create(
            user=user,
            problem=problem,
            language="py",
            code="print(3)",
            verdict="IQ",
        )

        response = self.client.get("/api/users/solver/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["user"]["username"], "solver")
        self.assertEqual(payload["stats"]["verdict_counts"]["AC"], 1)
        self.assertEqual(payload["stats"]["verdict_counts"]["WA"], 1)
        self.assertEqual(len(payload["recent_submissions"]), 3)

    def test_public_submissions_filters_by_verdict_prefix(self):
        user = create_user("solver")
        problem = Problem.objects.create(
            title="A + B",
            time_limit=1,
            memory_limit=64,
            statement="Statement",
            editorial="Editorial",
        )
        Submission.objects.create(
            user=user,
            problem=problem,
            language="py",
            code="print(1)",
            verdict="AC",
        )
        Submission.objects.create(
            user=user,
            problem=problem,
            language="py",
            code="print(2)",
            verdict="WA 1",
        )

        response = self.client.get("/api/users/solver/submissions/?verdict=WA")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["verdict"], "WA 1")
