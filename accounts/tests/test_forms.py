from django.test import TestCase

from accounts.forms import RegisterForm
from accounts.tests.helpers import create_user


class RegisterFormTests(TestCase):
    def valid_data(self, **overrides):
        data = {
            "username": "newuser",
            "email": "new@example.com",
            "password1": "ComplexPass12345!",
            "password2": "ComplexPass12345!",
            "phone_number": "555-0100",
        }
        data.update(overrides)
        return data

    def test_valid_register_form_normalizes_email_and_phone(self):
        form = RegisterForm(data=self.valid_data(email="NEW@EXAMPLE.COM "))

        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.cleaned_data["email"], "new@example.com")
        self.assertEqual(form.cleaned_data["phone_number"], "555-0100")

    def test_register_form_rejects_non_alphanumeric_username(self):
        form = RegisterForm(data=self.valid_data(username="bad-name"))

        self.assertFalse(form.is_valid())
        self.assertIn("username", form.errors)

    def test_register_form_rejects_duplicate_email_case_insensitively(self):
        create_user("existing", email="new@example.com")

        form = RegisterForm(data=self.valid_data(email="NEW@example.com"))

        self.assertFalse(form.is_valid())
        self.assertIn("email", form.errors)

    def test_register_form_rejects_duplicate_phone(self):
        create_user("existing", phone_number="555-0100")

        form = RegisterForm(data=self.valid_data())

        self.assertFalse(form.is_valid())
        self.assertIn("phone_number", form.errors)
