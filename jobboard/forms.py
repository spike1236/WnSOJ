from django import forms
from .models import Job


class AddJobForm(forms.ModelForm):
    salary_range = forms.JSONField(
        widget=forms.Textarea(attrs={'class': 'form-control'}),
        required=False
    )

    class Meta:
        model = Job
        fields = ['title', 'location', 'salary_range', 'info']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'location': forms.TextInput(attrs={'class': 'form-control'}),
            'info': forms.Textarea(attrs={'class': 'form-control'}),
        }
