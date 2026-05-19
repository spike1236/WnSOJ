from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

from problemset.models import Category, Problem, Submission


def create_user(username="user", *, is_staff=False):
    return get_user_model().objects.create_user(
        username=username,
        password="password",
        is_staff=is_staff,
        is_superuser=is_staff,
    )


def create_category(short_name="arrays", long_name="Arrays"):
    return Category.objects.create(
        short_name=short_name,
        long_name=long_name,
        img_url="https://example.com/category.svg",
    )


def create_problem(**overrides):
    defaults = {
        "title": "A + B",
        "time_limit": 1.0,
        "memory_limit": 64,
        "statement": "Add two numbers.",
        "editorial": "Use addition.",
        "code": "int main() {}",
    }
    defaults.update(overrides)
    return Problem.objects.create(**defaults)


def create_submission(user, problem, **overrides):
    defaults = {
        "language": "py",
        "code": "print(42)",
        "verdict": "IQ",
    }
    defaults.update(overrides)
    return Submission.objects.create(user=user, problem=problem, **defaults)


def make_problem_zip(entries=None, name="tests.zip"):
    if entries is None:
        entries = {
            "tests/input/01.txt": "1 2\n",
            "tests/output/01.txt": "3\n",
        }
    data = BytesIO()
    with ZipFile(data, "w") as zf:
        for path, content in entries.items():
            zf.writestr(path, content)
    return SimpleUploadedFile(
        name,
        data.getvalue(),
        content_type="application/zip",
    )


def write_problem_test(root, problem_id, filename, input_data, output_data):
    tests_root = Path(root) / str(problem_id) / "tests"
    input_dir = tests_root / "input"
    output_dir = tests_root / "output"
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    (input_dir / filename).write_text(input_data)
    (output_dir / filename).write_text(output_data)
