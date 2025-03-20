from django.db import models
from accounts.models import User


class Job(models.Model):
    title = models.CharField(max_length=200)
    location = models.CharField(max_length=200, default='Remote')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jobs')
    salary_range = models.JSONField(default=dict)
    info = models.TextField(default='Placeholder text')
    created_at = models.DateTimeField(auto_now_add=True)
