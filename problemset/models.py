from django.db import models
from accounts.models import User
from typing import Optional, Tuple


class Category(models.Model):
    short_name = models.CharField(max_length=50)
    long_name = models.CharField(max_length=100)
    img_url = models.CharField(max_length=200)

    def __str__(self):
        return self.long_name


class Problem(models.Model):
    title = models.CharField(max_length=200)
    time_limit = models.FloatField()
    memory_limit = models.IntegerField()
    statement = models.TextField()
    editorial = models.TextField()
    categories = models.ManyToManyField(Category, related_name="problems")
    code = models.TextField(max_length=65536, default="")


class Submission(models.Model):
    VERDICT_CHOICES = [
        ("IQ", "In queue"),
        ("AC", "Accepted"),
        ("WA", "Wrong Answer"),
        ("TLE", "Time Limit Exceeded"),
        ("MLE", "Memory Limit Exceeded"),
        ("CE", "Compilation Error"),
        ("RE", "Runtime Error"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submissions")
    problem = models.ForeignKey(
        Problem, on_delete=models.CASCADE, related_name="submissions"
    )
    verdict = models.CharField(max_length=20, choices=VERDICT_CHOICES, default="IQ")
    time = models.IntegerField(default=0)
    memory = models.IntegerField(default=0)
    language = models.CharField(max_length=20)
    code = models.TextField(max_length=65536, default="")
    send_time = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @staticmethod
    def parse_verdict(value: Optional[str]) -> Tuple[Optional[str], Optional[int]]:
        v = (value or "").strip()
        if not v:
            return (None, None)
        if v.lower() == "in queue":
            return ("IQ", None)
        parts = v.split()
        code = (parts[0] or "").upper() if parts else ""
        testcase: Optional[int] = None
        if len(parts) >= 2:
            try:
                n = int(parts[1])
                testcase = n if n > 0 else None
            except (TypeError, ValueError):
                testcase = None
        return (code or None, testcase)

    @property
    def verdict_code(self) -> Optional[str]:
        return self.parse_verdict(self.verdict)[0]

    @property
    def verdict_testcase(self) -> Optional[int]:
        return self.parse_verdict(self.verdict)[1]

    @property
    def verdict_display(self) -> str:
        code, testcase = self.parse_verdict(self.verdict)
        if not code:
            return "—"
        if testcase:
            return f"{code} #{testcase}"
        return code
