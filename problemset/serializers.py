# problemset/serializers.py

from rest_framework import serializers
from .models import Category, Problem, Submission
from accounts.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'short_name', 'long_name', 'img_url']


class ProblemSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    users_solved = UserSerializer(many=True, read_only=True)
    users_unsolved = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Problem
        fields = ['id', 'title', 'time_limit', 'memory_limit', 'statement', 'editorial',
                  'categories', 'code', 'users_solved', 'users_unsolved']


class SubmissionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    problem = ProblemSerializer(read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'user', 'problem', 'verdict', 'time', 'memory',
                  'language', 'code', 'send_time']
        read_only_fields = ['verdict', 'time', 'memory', 'send_time']
