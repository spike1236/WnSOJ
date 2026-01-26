# problemset/serializers.py

from rest_framework import serializers
from .models import Category, Problem, Submission
from accounts.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "short_name", "long_name", "img_url"]


class ProblemPublicSerializer(serializers.ModelSerializer):
    """Public problem representation.

    Intentionally excludes the official solution code and per-user solved lists.
    """

    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id",
            "title",
            "time_limit",
            "memory_limit",
            "statement",
            "editorial",
            "categories",
        ]


class ProblemAdminSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    users_solved = UserSerializer(many=True, read_only=True)
    users_unsolved = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id",
            "title",
            "time_limit",
            "memory_limit",
            "statement",
            "editorial",
            "categories",
            "code",
            "users_solved",
            "users_unsolved",
        ]


class ProblemListSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Problem
        fields = [
            "id",
            "title",
            "time_limit",
            "memory_limit",
            "categories",
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    problem_id = serializers.PrimaryKeyRelatedField(
        queryset=Problem.objects.all(), source="problem", write_only=True
    )
    user = UserSerializer(read_only=True)
    problem = ProblemPublicSerializer(read_only=True)
    verdict_code = serializers.SerializerMethodField(read_only=True)
    verdict_testcase = serializers.SerializerMethodField(read_only=True)

    def get_verdict_code(self, obj):
        return (obj.verdict or "").split()[0] if obj.verdict else None

    def get_verdict_testcase(self, obj):
        parts = (obj.verdict or "").split()
        if len(parts) < 2:
            return None
        try:
            return int(parts[1])
        except (TypeError, ValueError):
            return None

    class Meta:
        model = Submission
        fields = [
            "id",
            "problem_id",
            "user",
            "problem",
            "verdict",
            "verdict_code",
            "verdict_testcase",
            "time",
            "memory",
            "language",
            "code",
            "send_time",
            "updated_at",
        ]
        read_only_fields = ["verdict", "time", "memory", "send_time", "updated_at"]


class SubmissionListSerializer(serializers.ModelSerializer):
    problem_id = serializers.IntegerField(source="problem_id", read_only=True)
    problem_title = serializers.CharField(source="problem.title", read_only=True)
    user_id = serializers.IntegerField(source="user_id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    verdict_code = serializers.SerializerMethodField(read_only=True)
    verdict_testcase = serializers.SerializerMethodField(read_only=True)

    def get_verdict_code(self, obj):
        return (obj.verdict or "").split()[0] if obj.verdict else None

    def get_verdict_testcase(self, obj):
        parts = (obj.verdict or "").split()
        if len(parts) < 2:
            return None
        try:
            return int(parts[1])
        except (TypeError, ValueError):
            return None

    class Meta:
        model = Submission
        fields = [
            "id",
            "user_id",
            "username",
            "problem_id",
            "problem_title",
            "verdict",
            "verdict_code",
            "verdict_testcase",
            "time",
            "memory",
            "language",
            "send_time",
            "updated_at",
        ]
