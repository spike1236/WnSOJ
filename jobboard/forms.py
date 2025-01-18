from django import forms
from .models import Job

class AddJobForm(forms.ModelForm):
    whole_info = forms.CharField(widget=forms.Textarea)

    class Meta:
        model = Job
        fields = ['title', 'short_info']