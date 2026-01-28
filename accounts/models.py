from django.db import models
from django.contrib.auth.models import AbstractUser
import random
from django.conf import settings
import os


class User(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    account_type = models.IntegerField(default=1)
    icon_id = models.IntegerField(null=True)
    problems_solved = models.ManyToManyField(
        "problemset.Problem", related_name="users_solved", blank=True
    )
    problems_unsolved = models.ManyToManyField(
        "problemset.Problem", related_name="users_unsolved", blank=True
    )

    @property
    def icon64_url(self):
        if not self.icon_id or self.icon_id < 0:
            return os.path.join(settings.MEDIA_URL, "users_icons/icon64/default.png")
        return os.path.join(
            settings.MEDIA_URL, f"users_icons/icon64/{self.icon_id}.png"
        )

    @property
    def icon170_url(self):
        if not self.icon_id or self.icon_id < 0:
            return os.path.join(settings.MEDIA_URL, "users_icons/icon170/default.png")
        return os.path.join(
            settings.MEDIA_URL, f"users_icons/icon170/{self.icon_id}.png"
        )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
