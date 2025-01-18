from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User

class RegisterForm(UserCreationForm):
    fullname = forms.CharField(max_length=100, required=False)
    phone_number = forms.CharField(max_length=20, required=False)
    icon = forms.ImageField(required=False)
    is_business = forms.BooleanField(required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2', 'fullname', 'phone_number', 'is_business']

class ChangeIconForm(forms.Form):
    icon = forms.ImageField()

class ChangePasswordForm(forms.Form):
    old_password = forms.CharField(widget=forms.PasswordInput)
    new_password1 = forms.CharField(widget=forms.PasswordInput)
    new_password2 = forms.CharField(widget=forms.PasswordInput)
