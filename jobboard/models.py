from django.db import models
from accounts.models import User


class Job(models.Model):
    job_id = models.IntegerField()
    title = models.CharField(max_length=200)
    short_info = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jobs')
