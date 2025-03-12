from django import forms
from .models import Problem


class AddProblemForm(forms.Form):
    title = forms.CharField(max_length=255, required=True)
    category = forms.CharField(max_length=255, required=True,
                               help_text="Comma-separated category short names")
    statement = forms.FileField(required=True, help_text="HTML file")
    editorial = forms.FileField(required=True, help_text="HTML file")
    time_limit = forms.FloatField(required=True)
    memory_limit = forms.IntegerField(required=True)
    test_data = forms.FileField(required=True, help_text="ZIP file")

    class Meta:
        model = Problem
        fields = ['title', 'time_limit', 'memory_limit']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({'class': 'form-control'})


class SubmitForm(forms.Form):
    LANGUAGE_CHOICES = [
        ('cpp', 'GNU C++17'),
        ('py', 'Python 3'),
    ]
    language = forms.ChoiceField(choices=LANGUAGE_CHOICES)
    code = forms.CharField(widget=forms.Textarea, max_length=65536)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({'class': 'form-control'})
