from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Job
from .forms import AddJobForm
from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.authentication import SessionAuthentication
from .serializers import JobListSerializer, JobSerializer
from django.db.models import Q


def format_number(value):
    """Format large numbers with k (thousands) or M (millions) suffix."""
    try:
        value = float(value)
        if value >= 1000000000:
            return f"{value / 1000000000:.1f}B".replace(".0B", "B")
        if value >= 1000000:
            return f"{value / 1000000:.1f}M".replace(".0M", "M")
        elif value >= 1000:
            return f"{value / 1000:.1f}k".replace(".0k", "k")
        else:
            return str(int(value))
    except (ValueError, TypeError):
        return str(value)


def build_salary_range(min_salary, max_salary, currency):
    min_salary = (min_salary or "").strip()
    max_salary = (max_salary or "").strip()
    currency = (currency or "$").strip() or "$"

    try:
        min_value = float(min_salary) if min_salary else None
        max_value = float(max_salary) if max_salary else None
    except ValueError:
        return None, "Salary values must be valid numbers."

    if min_value is not None and max_value is not None and min_value > max_value:
        return None, "Minimum salary cannot be greater than maximum salary."

    salary_range = {"min": min_salary if min_salary else 0, "currency": currency}
    if max_salary:
        salary_range["max"] = max_salary
    return salary_range, None


def jobs(request):
    jobs = Job.objects.all()
    query = (request.GET.get("q") or "").strip()
    if query:
        jobs = jobs.filter(
            Q(title__icontains=query)
            | Q(location__icontains=query)
            | Q(user__username__icontains=query)
            | Q(info__icontains=query)
        )
    return render(
        request,
        "jobboard/jobs.html",
        {
            "title": "Jobs | WnSOJ",
            "navbar_item_id": 3,
            "jobs": jobs,
            "format_number": format_number,
        },
    )


@login_required
def add_job(request):
    if request.user.account_type == 1:
        return redirect("jobs")

    if request.method == "POST":
        form = AddJobForm(request.POST)
        if form.is_valid():
            min_salary = request.POST.get("min_salary", "")
            max_salary = request.POST.get("max_salary", "")
            currency = request.POST.get("currency", "$")

            salary_range, salary_error = build_salary_range(
                min_salary, max_salary, currency
            )

            if not salary_error:
                job = form.save(commit=False)
                job.user = request.user
                job.salary_range = salary_range
                job.save()
                return redirect("jobs")
            else:
                return render(
                    request,
                    "jobboard/add_job.html",
                    {
                        "title": "Add Job | WnSOJ",
                        "navbar_item_id": 3,
                        "form": form,
                        "min_salary": min_salary,
                        "max_salary": max_salary,
                        "currency": currency,
                        "salary_error": salary_error,
                    },
                )
    else:
        form = AddJobForm()
    return render(
        request,
        "jobboard/add_job.html",
        {"title": "Add Job | WnSOJ", "navbar_item_id": 3, "form": form},
    )


def job(request, job_id):
    job = get_object_or_404(Job, id=job_id)
    return render(
        request,
        "jobboard/job.html",
        {
            "title": job.title + " | WnSOJ",
            "navbar_item_id": 3,
            "job": job,
            "format_number": format_number,
        },
    )


def edit_job(request, job_id):
    job = get_object_or_404(Job, id=job_id)

    if not request.user.is_authenticated or (
        request.user != job.user and not request.user.is_staff
    ):
        return redirect("job", job_id=job_id)

    min_salary = job.salary_range.get("min", "") if job.salary_range else ""
    max_salary = job.salary_range.get("max", "") if job.salary_range else ""
    currency = job.salary_range.get("currency", "$") if job.salary_range else "$"

    if request.method == "POST":
        form = AddJobForm(request.POST, instance=job)
        if form.is_valid():
            min_salary = request.POST.get("min_salary", "")
            max_salary = request.POST.get("max_salary", "")
            currency = request.POST.get("currency", "$")

            salary_range, salary_error = build_salary_range(
                min_salary, max_salary, currency
            )

            if not salary_error:
                job_instance = form.save(commit=False)
                job_instance.salary_range = salary_range
                job_instance.save()
                return redirect("job", job_id=job_id)
            else:
                return render(
                    request,
                    "jobboard/add_job.html",
                    {
                        "title": f"Edit {job.title} | WnSOJ",
                        "navbar_item_id": 3,
                        "form": form,
                        "job": job,
                        "min_salary": min_salary,
                        "max_salary": max_salary,
                        "currency": currency,
                        "is_edit": True,
                        "salary_error": salary_error,
                    },
                )
    else:
        form = AddJobForm(instance=job)

    return render(
        request,
        "jobboard/add_job.html",
        {
            "title": f"Edit {job.title} | WnSOJ",
            "navbar_item_id": 3,
            "form": form,
            "job": job,
            "min_salary": min_salary,
            "max_salary": max_salary,
            "currency": currency,
            "is_edit": True,
        },
    )


def delete_job(request, job_id):
    job = get_object_or_404(Job, id=job_id)
    if not request.user.is_authenticated or (
        request.user != job.user and not request.user.is_staff
    ):
        return redirect("job", job_id=job_id)
    job.delete()
    return redirect("jobs")


class JobAPIViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing jobs.
    - List, Retrieve: available to all users.
    - Create, Update, Destroy: restricted to the job's owner or admin users.
    """

    queryset = Job.objects.all().select_related("user").order_by("-created_at")
    serializer_class = JobSerializer
    authentication_classes = [SessionAuthentication]

    def get_queryset(self):
        qs = super().get_queryset()
        query = (self.request.query_params.get("q") or "").strip()[:100]
        author = (self.request.query_params.get("author") or "").strip()[:150]
        if query:
            qs = qs.filter(
                Q(title__icontains=query)
                | Q(location__icontains=query)
                | Q(user__username__icontains=query)
                | Q(info__icontains=query)
            )
        if author:
            qs = qs.filter(user__username=author)
        return qs

    def get_serializer_class(self):
        if self.action == "list" and self.request.query_params.get("compact") == "1":
            return JobListSerializer
        return super().get_serializer_class()

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            self.permission_classes = [permissions.IsAuthenticated]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_staff and getattr(user, "account_type", 1) != 2:
            raise PermissionDenied("Only business accounts can create jobs.")

        serializer.save(user=user)

    def perform_update(self, serializer):
        job = self.get_object()
        if self.request.user != job.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to edit this job.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user != instance.user and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to delete this job.")
        instance.delete()
