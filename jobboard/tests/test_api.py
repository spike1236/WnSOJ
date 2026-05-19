import json

from django.test import TestCase, override_settings

from accounts.tests.helpers import create_user
from jobboard.models import Job
from jobboard.tests.helpers import create_business_user, create_job


@override_settings(INTERNAL_API_KEY="")
class JobAPITests(TestCase):
    def post_json(self, path, payload):
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def patch_json(self, path, payload):
        return self.client.patch(
            path,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_anonymous_user_can_list_jobs(self):
        create_job()

        response = self.client.get("/api/jobs/?compact=1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["title"], "Backend Engineer")

    def test_normal_user_cannot_create_job(self):
        self.client.force_login(create_user("normal"))

        response = self.post_json(
            "/api/jobs/",
            {
                "title": "Frontend Engineer",
                "location": "Remote",
                "salary_range": {"min": "1", "currency": "$"},
                "info": "Build UI.",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Job.objects.count(), 0)

    def test_business_user_can_create_job(self):
        business = create_business_user("company")
        self.client.force_login(business)

        response = self.post_json(
            "/api/jobs/",
            {
                "title": "Frontend Engineer",
                "location": "New York",
                "salary_range": {"min": "90000", "max": "120000", "currency": "$"},
                "info": "Build UI.",
            },
        )

        self.assertEqual(response.status_code, 201)
        job = Job.objects.get(title="Frontend Engineer")
        self.assertEqual(job.user, business)
        self.assertEqual(job.salary_range["max"], "120000")

    def test_query_and_author_filters_limit_job_list(self):
        company = create_business_user("company")
        other = create_business_user("other")
        create_job(user=company, title="Python Engineer", location="Remote")
        create_job(user=other, title="Designer", location="London")

        response = self.client.get("/api/jobs/?compact=1&q=python&author=company")

        self.assertEqual(response.status_code, 200)
        results = response.json()["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Python Engineer")
        self.assertEqual(results[0]["username"], "company")

    def test_non_owner_cannot_update_or_delete_job(self):
        owner = create_business_user("owner")
        other = create_business_user("other")
        job = create_job(user=owner)
        self.client.force_login(other)

        update_response = self.patch_json(
            f"/api/jobs/{job.id}/",
            {"title": "Changed"},
        )
        delete_response = self.client.delete(f"/api/jobs/{job.id}/")

        self.assertEqual(update_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)
        job.refresh_from_db()
        self.assertEqual(job.title, "Backend Engineer")

    def test_owner_can_update_job_and_staff_can_delete(self):
        owner = create_business_user("owner")
        staff = create_user("staff", is_staff=True, is_superuser=True)
        job = create_job(user=owner)

        self.client.force_login(owner)
        update_response = self.patch_json(
            f"/api/jobs/{job.id}/",
            {"title": "Platform Engineer"},
        )

        self.assertEqual(update_response.status_code, 200)
        job.refresh_from_db()
        self.assertEqual(job.title, "Platform Engineer")

        self.client.force_login(staff)
        delete_response = self.client.delete(f"/api/jobs/{job.id}/")

        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(Job.objects.filter(id=job.id).exists())
