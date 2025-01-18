from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    account_type = models.IntegerField(default=0)  # 0=common, 1=business
    icon_id = models.IntegerField(null=True)
    problems_solved = models.ManyToManyField('problemset.Problem', related_name='users_solved')
    problems_unsolved = models.ManyToManyField('problemset.Problem', related_name='users_unsolved')
