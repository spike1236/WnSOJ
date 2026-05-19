from unittest.mock import patch

from django.test import TestCase

from accounts.models import User
from accounts.serializers import RegisterSerializer, UserDetailSerializer
from accounts.tests.helpers import create_user


class RegisterSerializerTests(TestCase):
    def valid_data(self, **overrides):
        data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "ComplexPass12345!",
            "password2": "ComplexPass12345!",
            "is_business": False,
        }
        data.update(overrides)
        return data

    def test_register_serializer_creates_user_with_negative_icon_without_upload(self):
        with patch("accounts.serializers.random.randint", return_value=12345678):
            serializer = RegisterSerializer(data=self.valid_data())
            self.assertTrue(serializer.is_valid(), serializer.errors)
            user = serializer.save()

        self.assertEqual(user.username, "newuser")
        self.assertTrue(user.check_password("ComplexPass12345!"))
        self.assertEqual(user.icon_id, -12345678)
        self.assertEqual(user.account_type, 1)

    def test_register_serializer_creates_business_user(self):
        serializer = RegisterSerializer(data=self.valid_data(is_business=True))

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()

        self.assertEqual(user.account_type, 2)

    def test_register_serializer_rejects_password_mismatch(self):
        serializer = RegisterSerializer(
            data=self.valid_data(password2="DifferentPass12345!")
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_register_serializer_rejects_duplicate_email(self):
        create_user("existing", email="new@example.com")

        serializer = RegisterSerializer(data=self.valid_data(email="NEW@example.com"))

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)


class UserDetailSerializerTests(TestCase):
    def test_user_detail_serializer_updates_business_flag(self):
        user = create_user("profile", account_type=1)
        serializer = UserDetailSerializer(
            user,
            data={
                "username": "profile",
                "email": "profile@example.com",
                "phone_number": "",
                "is_business": True,
            },
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        user.refresh_from_db()
        self.assertEqual(user.account_type, 2)

    def test_user_detail_serializer_rejects_duplicate_phone(self):
        create_user("other", phone_number="555-0100")
        user = User.objects.create_user(
            username="profile",
            email="profile@example.com",
            password="password",
        )

        serializer = UserDetailSerializer(
            user,
            data={"phone_number": "555-0100"},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("phone_number", serializer.errors)
