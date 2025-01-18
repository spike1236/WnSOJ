from django import forms
from .models import Problem

class AddProblemForm(forms.ModelForm):
    statement = forms.FileField()
    editorial = forms.FileField()
    test_data = forms.FileField()
    category = forms.CharField(max_length=100)

    class Meta:
        model = Problem
        fields = ['title', 'time_limit', 'memory_limit']

class SubmitForm(forms.Form):
    LANGUAGE_CHOICES = [
        ('GNU C++17', 'GNU C++17'),
        ('Python 3', 'Python 3'),
    ]
    language = forms.ChoiceField(choices=LANGUAGE_CHOICES)
    code = forms.CharField(widget=forms.Textarea)
