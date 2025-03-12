from django import forms
from .models import Job


class AddJobForm(forms.ModelForm):
    class Meta:
        model = Job
        fields = ['title', 'short_info', 'whole_info']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'short_info': forms.Textarea(attrs={'class': 'form-control'}),
            'whole_info': forms.Textarea(attrs={'class': 'form-control'}),
        }

