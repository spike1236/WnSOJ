# problemset/serializers.py

from rest_framework import serializers
from .models import Category, Problem, Submission
from accounts.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "short_name", "long_name", "img_url"]


class ProblemPublicSerializer(serializers.ModelSerializer):
    """Public problem representation."""

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
            "code",
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


class ProblemCreateSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=200)
    time_limit = serializers.FloatField()
    memory_limit = serializers.IntegerField()
    statement = serializers.CharField()
    editorial = serializers.CharField()
    code = serializers.CharField(required=False, allow_blank=True, default="")
    categories = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)
    test_data = serializers.FileField()

    def validate_categories(self, value):
        ids = list(dict.fromkeys(value))
        found = set(Category.objects.filter(id__in=ids).values_list("id", flat=True))
        missing = [i for i in ids if i not in found]
        if missing:
            raise serializers.ValidationError("Invalid categories.")
        return ids

    def create(self, validated_data):
        from django.conf import settings
        from pathlib import Path
        from zipfile import ZipFile
        from io import BytesIO
        import shutil

        category_ids = validated_data.pop("categories")
        test_data = validated_data.pop("test_data")

        problem = Problem.objects.create(**validated_data)
        problem.categories.set(Category.objects.filter(id__in=category_ids))

        try:
            problemset_category = Category.objects.get(short_name="problemset")
            problem.categories.add(problemset_category)
        except Category.DoesNotExist:
            pass

        dest = Path(settings.BASE_DIR) / "data" / "problems" / str(problem.id)
        if dest.exists():
            shutil.rmtree(dest, ignore_errors=True)
        dest.mkdir(parents=True, exist_ok=True)

        try:
            data = test_data.read()
            with ZipFile(BytesIO(data), "r") as zf:
                total_size = 0
                for info in zf.infolist():
                    name = info.filename
                    if not name or name.endswith("/"):
                        continue
                    total_size += int(getattr(info, "file_size", 0) or 0)
                    if total_size > 250 * 1024 * 1024:
                        raise serializers.ValidationError({"test_data": "Zip is too large."})
                    normalized = name.replace("\\", "/")
                    p = Path(normalized)
                    if p.is_absolute() or ".." in p.parts:
                        raise serializers.ValidationError({"test_data": "Invalid zip contents."})
                    out_path = dest / p
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    with zf.open(info) as src, open(out_path, "wb") as dst:
                        shutil.copyfileobj(src, dst)
        except Exception:
            shutil.rmtree(dest, ignore_errors=True)
            raise

        return problem

    def to_representation(self, instance):
        return ProblemPublicSerializer(instance).data


class ProblemListSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    solved_count = serializers.SerializerMethodField(read_only=True)
    user_status = serializers.SerializerMethodField(read_only=True)

    def get_solved_count(self, obj: Problem) -> int:
        value = getattr(obj, "solved_count", None)
        if isinstance(value, int):
            return value
        return obj.users_solved.count()

    def get_user_status(self, obj: Problem) -> str:
        if getattr(obj, "is_solved", False):
            return "solved"
        if getattr(obj, "is_attempted", False):
            return "attempted"
        return "none"

    class Meta:
        model = Problem
        fields = [
            "id",
            "title",
            "time_limit",
            "memory_limit",
            "categories",
            "solved_count",
            "user_status",
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    problem_id = serializers.PrimaryKeyRelatedField(
        queryset=Problem.objects.all(), source="problem", write_only=True
    )
    user = UserSerializer(read_only=True)
    problem = ProblemPublicSerializer(read_only=True)
    verdict_code = serializers.SerializerMethodField(read_only=True)
    verdict_testcase = serializers.SerializerMethodField(read_only=True)

    def get_verdict_code(self, obj: Submission) -> str | None:
        return (obj.verdict or "").split()[0] if obj.verdict else None

    def get_verdict_testcase(self, obj: Submission) -> int | None:
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
    problem_id = serializers.IntegerField(read_only=True)
    problem_title = serializers.CharField(source="problem.title", read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    verdict_code = serializers.SerializerMethodField(read_only=True)
    verdict_testcase = serializers.SerializerMethodField(read_only=True)

    def get_verdict_code(self, obj: Submission) -> str | None:
        return (obj.verdict or "").split()[0] if obj.verdict else None

    def get_verdict_testcase(self, obj: Submission) -> int | None:
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
