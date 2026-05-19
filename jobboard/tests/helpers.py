from accounts.tests.helpers import create_user
from jobboard.models import Job


def create_business_user(username="business", **overrides):
    overrides.setdefault("account_type", 2)
    return create_user(username, **overrides)


def create_job(user=None, **overrides):
    if user is None:
        user = create_business_user()
    defaults = {
        "title": "Backend Engineer",
        "location": "Remote",
        "salary_range": {"min": "100000", "max": "150000", "currency": "$"},
        "info": "Build judge infrastructure.",
    }
    defaults.update(overrides)
    return Job.objects.create(user=user, **defaults)
