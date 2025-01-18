from django.contrib import admin
from .models import Problem, Category, Submission

admin.site.register(Problem)
admin.site.register(Category)
admin.site.register(Submission)
