from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase

from problemset.test_data import TestDataValidationError, extract_problem_test_data
from problemset.tests.helpers import make_problem_zip


class ExtractProblemTestDataTests(SimpleTestCase):
    def test_extracts_valid_input_and_output_files(self):
        with TemporaryDirectory() as tmp:
            extract_problem_test_data(make_problem_zip(), Path(tmp))

            self.assertTrue(Path(tmp, "tests", "input", "01.txt").exists())
            self.assertTrue(Path(tmp, "tests", "output", "01.txt").exists())

    def test_rejects_files_outside_expected_test_dirs(self):
        archive = make_problem_zip(
            {
                "tests/input/01.txt": "1 2\n",
                "tests/output/01.txt": "3\n",
                "notes/readme.txt": "extra",
            }
        )

        with TemporaryDirectory() as tmp:
            with self.assertRaises(TestDataValidationError):
                extract_problem_test_data(archive, Path(tmp))

    def test_rejects_archive_over_size_limit(self):
        archive = make_problem_zip()

        with TemporaryDirectory() as tmp:
            with self.assertRaises(TestDataValidationError):
                extract_problem_test_data(archive, Path(tmp), max_size=1)
