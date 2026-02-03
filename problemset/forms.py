from django import forms
from .models import Problem, Category


class AddProblemForm(forms.Form):
    title = forms.CharField(max_length=255, required=True)
    categories = forms.ModelMultipleChoiceField(
        queryset=Category.objects.exclude(short_name="problemset"),
        widget=forms.CheckboxSelectMultiple,
        required=True,
        help_text="Select problem categories",
    )
    statement = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 10}),
        required=True,
        help_text="Markdown format",
    )
    editorial = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 10}),
        required=True,
        help_text="Markdown format",
    )
    time_limit = forms.FloatField(required=True)
    memory_limit = forms.IntegerField(required=True)
    test_data = forms.FileField(required=True, help_text="ZIP file")
    solution = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 10, "id": "code_area"}),
        required=True,
        help_text="Solution code for this problem",
    )

    class Meta:
        model = Problem
        fields = ["title", "time_limit", "memory_limit"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != "categories":
                field.widget.attrs.update({"class": "form-control"})


class SubmitForm(forms.Form):
    LANGUAGE_CHOICES = [
        ("cpp", "GNU C++23"),
        ("py", "Python 3.12"),
    ]
    language = forms.ChoiceField(choices=LANGUAGE_CHOICES)
    code = forms.CharField(widget=forms.Textarea, max_length=65536)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({"class": "form-control"})
