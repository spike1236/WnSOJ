from rest_framework import serializers
from .models import User
import os
from app import settings
from PIL import Image
import random

USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 16


class UserSerializer(serializers.ModelSerializer):
    icon64_url = serializers.SerializerMethodField(read_only=True)
    icon170_url = serializers.SerializerMethodField(read_only=True)

    def get_icon64_url(self, obj: User) -> str | None:
        return getattr(obj, "icon64_url", None)

    def get_icon170_url(self, obj: User) -> str | None:
        return getattr(obj, "icon170_url", None)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "account_type",
            "icon_id",
            "icon64_url",
            "icon170_url",
        ]


class PublicUserSerializer(serializers.ModelSerializer):
    icon64_url = serializers.SerializerMethodField(read_only=True)
    icon170_url = serializers.SerializerMethodField(read_only=True)

    def get_icon64_url(self, obj: User) -> str | None:
        return getattr(obj, "icon64_url", None)

    def get_icon170_url(self, obj: User) -> str | None:
        return getattr(obj, "icon170_url", None)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "account_type",
            "icon_id",
            "icon64_url",
            "icon170_url",
        ]


class UserDetailSerializer(serializers.ModelSerializer):
    is_business = serializers.BooleanField(required=False)
    is_staff = serializers.BooleanField(read_only=True)
    icon64_url = serializers.SerializerMethodField(read_only=True)
    icon170_url = serializers.SerializerMethodField(read_only=True)

    def get_icon64_url(self, obj: User) -> str | None:
        return getattr(obj, "icon64_url", None)

    def get_icon170_url(self, obj: User) -> str | None:
        return getattr(obj, "icon170_url", None)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_business",
            "is_staff",
            "icon64_url",
            "icon170_url",
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["is_business"] = instance.account_type == 2
        return ret

    def validate_username(self, value: str) -> str:
        username = (value or "").strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        if (
            len(username) < USERNAME_MIN_LENGTH
            or len(username) > USERNAME_MAX_LENGTH
            or not username.isalnum()
        ):
            raise serializers.ValidationError(
                "Username must be 3-16 alphanumeric characters."
            )
        return username

    def validate_email(self, value: str) -> str:
        email = (value or "").strip().lower()
        if not email:
            return ""

        qs = User.objects.filter(email__iexact=email)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate_phone_number(self, value: str | None) -> str | None:
        phone = (value or "").strip()
        if not phone:
            return None

        qs = User.objects.filter(phone_number=phone)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A user with this phone number already exists."
            )
        return phone


class PublicUserProfileSerializer(serializers.ModelSerializer):
    icon64_url = serializers.SerializerMethodField(read_only=True)
    icon170_url = serializers.SerializerMethodField(read_only=True)

    def get_icon64_url(self, obj: User) -> str | None:
        return getattr(obj, "icon64_url", None)

    def get_icon170_url(self, obj: User) -> str | None:
        return getattr(obj, "icon170_url", None)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "account_type",
            "icon_id",
            "icon64_url",
            "icon170_url",
            "is_staff",
        ]

    def update(self, instance, validated_data):
        if "is_business" in validated_data:
            is_business = validated_data.pop("is_business")
            instance.account_type = 2 if is_business else 1
        return super().update(instance, validated_data)


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        min_length=USERNAME_MIN_LENGTH, max_length=USERNAME_MAX_LENGTH
    )
    password = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    password2 = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    icon = serializers.ImageField(required=False)
    is_business = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "password",
            "password2",
            "icon",
            "is_business",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return attrs

    def validate_username(self, value: str) -> str:
        username = (value or "").strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        if not username.isalnum():
            raise serializers.ValidationError(
                "Username must be 3-16 alphanumeric characters."
            )
        return username

    def validate_email(self, value: str) -> str:
        email = (value or "").strip().lower()
        if not email:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate_phone_number(self, value: str | None) -> str | None:
        phone = (value or "").strip()
        if not phone:
            return None
        if User.objects.filter(phone_number=phone).exists():
            raise serializers.ValidationError(
                "A user with this phone number already exists."
            )
        return phone

    def create(self, validated_data):
        validated_data.pop("password2")
        icon = validated_data.pop("icon", None)
        is_business = validated_data.pop("is_business", False)
        user = User(**validated_data)
        user.account_type = 2 if is_business else 1
        user.set_password(validated_data["password"])
        user.icon_id = random.randint(10000000, 99999999)

        if icon:
            user.icon_id = abs(user.icon_id)
            icon64_dir = os.path.join(
                settings.BASE_DIR, "media", "users_icons", "icon64"
            )
            icon170_dir = os.path.join(
                settings.BASE_DIR, "media", "users_icons", "icon170"
            )
            os.makedirs(icon64_dir, exist_ok=True)
            os.makedirs(icon170_dir, exist_ok=True)

            icon64_path = os.path.join(icon64_dir, f"{user.icon_id}.png")
            icon170_path = os.path.join(icon170_dir, f"{user.icon_id}.png")

            img = Image.open(icon)
            img = img.resize((64, 64))
            img.save(icon64_path)
            icon.seek(0)
            img170 = Image.open(icon)
            img170 = img170.resize((170, 170))
            img170.save(icon170_path)
        else:
            user.icon_id = -user.icon_id

        user.save()
        return user
