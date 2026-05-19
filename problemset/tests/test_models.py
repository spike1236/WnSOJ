from django.test import SimpleTestCase

from problemset.models import Submission


class SubmissionVerdictParsingTests(SimpleTestCase):
    def test_parse_empty_verdict(self):
        self.assertEqual(Submission.parse_verdict(""), (None, None))

    def test_parse_in_queue_label(self):
        self.assertEqual(Submission.parse_verdict("In queue"), ("IQ", None))

    def test_parse_verdict_with_testcase(self):
        self.assertEqual(Submission.parse_verdict("wa 12"), ("WA", 12))

    def test_verdict_display_includes_testcase(self):
        submission = Submission(verdict="TLE 4")

        self.assertEqual(submission.verdict_code, "TLE")
        self.assertEqual(submission.verdict_testcase, 4)
        self.assertEqual(submission.verdict_display, "TLE #4")
