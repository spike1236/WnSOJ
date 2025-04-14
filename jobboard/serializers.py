from rest_framework import serializers
from .models import Job
from accounts.serializers import UserSerializer


class JobSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

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
