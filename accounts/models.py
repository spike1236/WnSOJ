from django.db import models
from django.contrib.auth.models import AbstractUser
import random


class User(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    account_type = models.IntegerField(default=0)
    icon_id = models.IntegerField(null=True)
    problems_solved = models.ManyToManyField('problemset.Problem',
                                             related_name='users_solved')
    problems_unsolved = models.ManyToManyField('problemset.Problem',
                                               related_name='users_unsolved')

    @property
    def icon64_url(self):
        if self.icon_id == -1:
            return 'media/users_icons/icon64/default.png'
        return f'media/users_icons/icon64/{self.icon_id}.png'

    @property
    def icon170_url(self):
        if self.icon_id == -1:
            return 'media/users_icons/icon170/default.png'
        return f'media/users_icons/icon170/{self.icon_id}.png'

    def save(self, *args, **kwargs):
        if self.icon_id == -1 and self.icon:
            icon_id = random.randint(10000000, 99999999)
            self.icon_id = icon_id
        super().save(*args, **kwargs)
