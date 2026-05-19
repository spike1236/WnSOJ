from django.test import TestCase

from accounts.tests.helpers import create_user
from jobboard.models import Job
from jobboard.tests.helpers import create_business_user, create_job
from jobboard.views import format_number


class FormatNumberTests(TestCase):
    def test_format_number_uses_suffixes(self):
        self.assertEqual(format_number(999), "999")
        self.assertEqual(format_number(1200), "1.2k")
        self.assertEqual(format_number(1000000), "1M")
        self.assertEqual(format_number(2500000000), "2.5B")

    def test_format_number_handles_invalid_values(self):
        self.assertEqual(format_number("unknown"), "unknown")


class JobViewPermissionTests(TestCase):
    def test_normal_user_is_redirected_from_add_job(self):
        self.client.force_login(create_user("normal"))

        response = self.client.get("/add_job/")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/jobs/")

    def test_business_user_can_add_job_with_salary_range(self):
        business = create_business_user("company")
        self.client.force_login(business)

        response = self.client.post(
            "/add_job/",
            {
                "title": "Backend Engineer",
                "location": "Remote",
                "info": "Build APIs.",
                "min_salary": "100000",
                "max_salary": "150000",
                "currency": "$",
            },
        )

        self.assertEqual(response.status_code, 302)
        job = Job.objects.get(title="Backend Engineer")
        self.assertEqual(job.user, business)
        self.assertEqual(
            job.salary_range,
            {"min": "100000", "max": "150000", "currency": "$"},
        )

    def test_business_user_cannot_add_job_with_invalid_salary_range(self):
        self.client.force_login(create_business_user("company"))

        response = self.client.post(
            "/add_job/",
            {
                "title": "Backend Engineer",
                "location": "Remote",
                "info": "Build APIs.",
                "min_salary": "150000",
                "max_salary": "100000",
                "currency": "$",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response, "Minimum salary cannot be greater than maximum salary."
        )
        self.assertEqual(Job.objects.count(), 0)

    def test_non_owner_cannot_delete_job_from_view(self):
        owner = create_business_user("owner")
        job = create_job(user=owner)
        self.client.force_login(create_business_user("other"))

        response = self.client.get(f"/job/{job.id}/delete/")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], f"/job/{job.id}/")
        self.assertTrue(Job.objects.filter(id=job.id).exists())

    def test_owner_can_delete_job_from_view(self):
        owner = create_business_user("owner")
        job = create_job(user=owner)
        self.client.force_login(owner)

        response = self.client.get(f"/job/{job.id}/delete/")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/jobs/")
        self.assertFalse(Job.objects.filter(id=job.id).exists())
