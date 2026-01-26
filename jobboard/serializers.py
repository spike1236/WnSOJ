from rest_framework import serializers
from .models import Job
from accounts.serializers import PublicUserSerializer


class JobSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "location",
            "user",
            "salary_range",
            "info",
            "created_at",
        ]
        read_only_fields = ["user", "created_at"]


class JobListSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user_id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "location",
            "user_id",
            "username",
            "salary_range",
            "created_at",
        ]
