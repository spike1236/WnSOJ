from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import TestCase, override_settings

from problemset.models import Problem
from problemset.tests.helpers import create_category, create_user, make_problem_zip


class AddProblemViewTests(TestCase):
    def setUp(self):
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.override = override_settings(PROBLEMS_DATA_ROOT=Path(self.tmp.name))
        self.override.enable()
        self.addCleanup(self.override.disable)

        create_category("problemset", "Problemset")
        self.category = create_category()
        self.staff = create_user("staff", is_staff=True)

    def post_problem(self, test_data=None):
        if test_data is None:
            test_data = make_problem_zip()
        return self.client.post(
            "/add_problem/",
            {
                "title": "Uploaded Problem",
                "categories": [self.category.id],
                "statement": "Statement",
                "editorial": "Editorial",
                "time_limit": "1",
                "memory_limit": "64",
                "solution": "int main() {}",
                "test_data": test_data,
            },
        )

    def test_non_staff_user_cannot_add_problem(self):
        self.client.force_login(create_user())

        response = self.post_problem()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Problem.objects.count(), 0)

    def test_staff_user_can_upload_problem_tests(self):
        self.client.force_login(self.staff)

        response = self.post_problem()

        self.assertEqual(response.status_code, 302)
        problem = Problem.objects.get(title="Uploaded Problem")
        self.assertTrue(
            Path(self.tmp.name, str(problem.id), "tests", "input", "01.txt").exists()
        )
        self.assertTrue(
            Path(self.tmp.name, str(problem.id), "tests", "output", "01.txt").exists()
        )
        self.assertEqual(
            set(problem.categories.values_list("short_name", flat=True)),
            {"arrays", "problemset"},
        )

    def test_invalid_zip_path_rolls_back_problem_creation(self):
        self.client.force_login(self.staff)

        response = self.post_problem(
            make_problem_zip({"../outside.txt": "bad"}, name="bad.zip")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Problem.objects.count(), 0)
        self.assertFalse(Path(self.tmp.name, "outside.txt").exists())

    def test_missing_output_folder_rolls_back_problem_creation(self):
        self.client.force_login(self.staff)

        response = self.post_problem(
            make_problem_zip({"tests/input/01.txt": "1 2\n"}, name="missing.zip")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Problem.objects.count(), 0)

    def test_missing_input_folder_rolls_back_problem_creation(self):
        self.client.force_login(self.staff)

        response = self.post_problem(
            make_problem_zip({"tests/output/01.txt": "3\n"}, name="missing.zip")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Problem.objects.count(), 0)

    def test_mismatched_test_filenames_rolls_back_problem_creation(self):
        self.client.force_login(self.staff)

        response = self.post_problem(
            make_problem_zip(
                {
                    "tests/input/01.txt": "1 2\n",
                    "tests/output/02.txt": "3\n",
                },
                name="mismatch.zip",
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Problem.objects.count(), 0)
