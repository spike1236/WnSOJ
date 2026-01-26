from django.shortcuts import render, redirect, get_object_or_404
from django.templatetags.static import static
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from .models import Category, Problem, Submission
from .forms import AddProblemForm, SubmitForm
import os
from zipfile import ZipFile
from io import BytesIO
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .serializers import (
    CategorySerializer,
    ProblemListSerializer,
    ProblemPublicSerializer,
    ProblemAdminSerializer,
    SubmissionListSerializer,
    SubmissionSerializer,
)


def home_page(request):
    return render(
        request,
        "index.html",
        {
            "title": "Home | WnSOJ",
            "navbar_item_id": 1,
            "card1": static("img/main_page_card1.svg"),
            "card2": static("img/main_page_card2.svg"),
            "card3": static("img/main_page_card3.svg"),
        },
    )


def categories(request):
    return render(
        request,
        "problemset/problems_list.html",
        {
            "title": "Problems | WnSOJ",
            "navbar_item_id": 2,
            "categories": list(Category.objects.all()),
            "show_categories": True,
        },
    )


def problems(request, category):
    cat = get_object_or_404(Category, short_name=category)
    return render(
        request,
        "problemset/problems_list.html",
        {
            "title": f"{cat.long_name} | WnSOJ",
            "navbar_item_id": 2,
            "problems": cat.problems.all(),
        },
    )


@login_required
def add_problem(request):
    if not request.user.is_staff:
        return HttpResponseForbidden()

    form = AddProblemForm()
    if request.method == "POST":
        form = AddProblemForm(request.POST, request.FILES)
        if form.is_valid():
            problem = Problem(
                time_limit=form.cleaned_data["time_limit"],
                memory_limit=form.cleaned_data["memory_limit"],
                title=form.cleaned_data["title"],
                statement=form.cleaned_data["statement"],
                editorial=form.cleaned_data["editorial"],
                code=form.cleaned_data["solution"],
            )
            problem.save()

            os.makedirs(f"data/problems/{problem.id}", exist_ok=True)
            with ZipFile(BytesIO(request.FILES["test_data"].read()), "r") as file:
                file.extractall(f"data/problems/{problem.id}")

            selected_categories = form.cleaned_data["categories"]
            for category in selected_categories:
                problem.categories.add(category)

            problem.categories.add(Category.objects.get(short_name="problemset"))

            return redirect("problems")

    context = {"title": "Add Problem | WnSOJ", "navbar_item_id": 2, "form": form}

    return render(request, "problemset/add_problem.html", context)


def problem_statement(request, problem_id):
    problem = get_object_or_404(Problem, id=problem_id)
    form = SubmitForm()
    if request.method == "POST":
        form = SubmitForm(request.POST, request.FILES)
        if form.is_valid():
            if request.user.is_authenticated:
                submission = Submission(
                    problem=problem,
                    user=request.user,
                    language=form.cleaned_data["language"],
                    code=form.cleaned_data["code"],
                    verdict="IQ",
                )
                submission.save()
                username = request.user.username
                return redirect(
                    f"/problem/{problem_id}/submissions?username={username}"
                )
            else:
                return redirect("login")
    return render(
        request,
        "problemset/problem.html",
        {
            "title": f"{problem.title} | WnSOJ",
            "current_bar_id": 1,
            "navbar_item_id": 2,
            "problem": problem,
            "form": form,
        },
    )


def problem_editorial(request, problem_id):
    problem = get_object_or_404(Problem, id=problem_id)
    return render(
        request,
        "problemset/editorial.html",
        {
            "title": f"{problem.title} | WnSOJ",
            "navbar_item_id": 2,
            "current_bar_id": 2,
            "problem": problem,
        },
    )


def problem_submissions_list(request, problem_id):
    problem = get_object_or_404(Problem, id=problem_id)
    submissions = Submission.objects.filter(problem=problem)

    username = request.GET.get("user") or request.GET.get("username")
    if username:
        submissions = submissions.filter(user__username=username)

    if "verdict" in request.GET and request.GET["verdict"]:
        submissions = submissions.filter(verdict=request.GET["verdict"])

    submissions = submissions.order_by("-id")[:10]

    return render(
        request,
        "problemset/problem_submissions.html",
        {
            "title": "Submissions | WnSOJ",
            "navbar_item_id": 2,
            "submissions": list(submissions),
            "problem": problem,
            "current_bar_id": 3,
        },
    )


def submissions(request):
    submissions = Submission.objects.all()

    if "username" in request.GET and request.GET["username"]:
        submissions = submissions.filter(user__username=request.GET["username"])

    if "verdict" in request.GET and request.GET["verdict"]:
        submissions = submissions.filter(verdict=request.GET["verdict"])

    submissions = submissions.order_by("-id")[:10]

    return render(
        request,
        "problemset/submissions_list.html",
        {
            "title": "Submissions | WnSOJ",
            "navbar_item_id": 2,
            "submissions": list(submissions),
        },
    )


def submission(request, submission_id):
    submission = get_object_or_404(Submission, id=submission_id)
    return render(
        request,
        "problemset/submission.html",
        {"title": "Submission | WnSOJ", "navbar_item_id": 2, "item": submission},
    )


def faq(request):
    return render(request, "faq.html", {"title": "FAQ | WnSOJ", "navbar_item_id": 4})


class CategoryAPIViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ProblemAPIViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing problems.
    - List, Retrieve: available to all users.
    - Create, Update, Destroy: restricted to admin users.
    """

    queryset = Problem.objects.all()
    serializer_class = ProblemPublicSerializer

    def get_queryset(self):
        qs = super().get_queryset().prefetch_related(
            "categories",
            "users_solved",
            "users_unsolved",
        )

        category_param = self.request.query_params.get("category")
        if category_param:
            parts = [p.strip() for p in category_param.split(",") if p.strip()]
            if parts:
                qs = qs.filter(categories__short_name__in=parts).distinct()
        return qs

    def get_serializer_class(self):
        if self.action == "list" and self.request.query_params.get("compact") == "1":
            return ProblemListSerializer

        if self.action in ["create", "update", "partial_update", "destroy"]:
            return ProblemAdminSerializer

        user = getattr(self.request, "user", None)
        if user and getattr(user, "is_staff", False):
            return ProblemAdminSerializer

        return ProblemPublicSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            self.permission_classes = [permissions.IsAdminUser]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()


class SubmissionAPIViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and creating submissions.
    - List: available to authenticated users.
    - Create: available to authenticated users.
    - Retrieve: available to the submitting user or admin.
    - Update, Destroy: restricted to admin users.
    """

    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff:
                return (
                    Submission.objects.all()
                    .select_related("user", "problem")
                    .order_by("-id")
                )
            return (
                Submission.objects.filter(user=user)
                .select_related("user", "problem")
                .order_by("-id")
            )
        return Submission.objects.none()

    def get_serializer_class(self):
        if self.action == "list" and self.request.query_params.get("compact") == "1":
            return SubmissionListSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, verdict="IQ")

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            self.permission_classes = [permissions.IsAdminUser]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    @extend_schema(operation_id="submissions_status_retrieve")
    @action(detail=True, methods=["get"], url_path="status")
    def status(self, request, pk=None):
        submission = self.get_object()
        verdict = submission.verdict or ""
        parts = verdict.split()
        verdict_code = parts[0] if parts else None
        verdict_testcase = None
        if len(parts) >= 2:
            try:
                verdict_testcase = int(parts[1])
            except (TypeError, ValueError):
                verdict_testcase = None

        return Response(
            {
                "id": submission.id,
                "verdict": submission.verdict,
                "verdict_code": verdict_code,
                "verdict_testcase": verdict_testcase,
                "time": submission.time,
                "memory": submission.memory,
                "send_time": submission.send_time,
                "updated_at": submission.updated_at,
            }
        )

    @extend_schema(operation_id="submissions_status_list")
    @action(detail=False, methods=["get"], url_path="status")
    def bulk_status(self, request):
        ids_param = request.query_params.get("ids", "")
        ids = []
        for raw in ids_param.split(","):
            raw = raw.strip()
            if not raw:
                continue
            try:
                ids.append(int(raw))
            except ValueError:
                continue

        queryset = self.get_queryset()
        if ids:
            queryset = queryset.filter(id__in=ids)

        items = []
        for submission in queryset.order_by("-id")[:200]:
            verdict = submission.verdict or ""
            parts = verdict.split()
            verdict_code = parts[0] if parts else None
            verdict_testcase = None
            if len(parts) >= 2:
                try:
                    verdict_testcase = int(parts[1])
                except (TypeError, ValueError):
                    verdict_testcase = None

            items.append(
                {
                    "id": submission.id,
                    "verdict": submission.verdict,
                    "verdict_code": verdict_code,
                    "verdict_testcase": verdict_testcase,
                    "time": submission.time,
                    "memory": submission.memory,
                    "send_time": submission.send_time,
                    "updated_at": submission.updated_at,
                }
            )

        return Response({"results": items})
