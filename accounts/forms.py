from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.forms import PasswordChangeForm
from .models import User


class RegisterForm(UserCreationForm):
    username = forms.CharField(min_length=3, max_length=16, required=True)
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=30, required=False)
    last_name = forms.CharField(max_length=30, required=False)
    phone_number = forms.CharField(max_length=20, required=False)
    icon = forms.ImageField(required=False)
    is_business = forms.BooleanField(required=False)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password1",
            "password2",
            "first_name",
            "last_name",
            "phone_number",
            "is_business",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({"class": "form-control"})

    def clean_username(self):
        username = (self.cleaned_data.get("username") or "").strip()
        if len(username) < 3 or len(username) > 16 or not username.isalnum():
            raise forms.ValidationError(
                "Username must be 3-16 alphanumeric characters."
            )
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("A user with that username already exists.")
        return username

    def clean_email(self):
        email = (self.cleaned_data.get("email") or "").strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("A user with this email already exists.")
        return email

    def clean_phone_number(self):
        phone = (self.cleaned_data.get("phone_number") or "").strip()
        if not phone:
            return ""
        if User.objects.filter(phone_number=phone).exists():
            raise forms.ValidationError("A user with this phone number already exists.")
        return phone


class LoginForm(AuthenticationForm):
    remember = forms.BooleanField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({"class": "form-control"})


class ChangeIconForm(forms.Form):
    icon = forms.ImageField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({"class": "form-control"})
