from django.contrib import admin, messages
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path

from .models import Problem, Category, JudgeJob, Submission
from .tasks import queue_retest_all_submissions, queue_retest_submissions


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    pass


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    pass


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    class VerdictCodeFilter(admin.SimpleListFilter):
        title = "verdict"
        parameter_name = "verdict_code"

        def lookups(self, request, model_admin):
            return [
                ("IQ", "In queue"),
                ("AC", "Accepted"),
                ("CE", "Compilation Error"),
                ("WA", "Wrong Answer"),
                ("RE", "Runtime Error"),
                ("TLE", "Time Limit Exceeded"),
                ("MLE", "Memory Limit Exceeded"),
            ]

        def queryset(self, request, queryset):
            value = self.value()
            if value:
                return queryset.filter(verdict__startswith=value)
            return queryset

    @admin.display(description="Verdict", ordering="verdict")
    def verdict_pretty(self, obj: Submission):
        return obj.verdict_display

    list_display = (
        "id",
        "problem",
        "user",
        "language",
        "verdict_pretty",
        "send_time",
        "updated_at",
    )
    list_filter = (VerdictCodeFilter, "language", "problem")
    search_fields = ("user__username", "problem__title", "id")
    ordering = ("-id",)
    actions = ("retest_selected_submissions",)

    change_list_template = "admin/problemset/submission/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "retest-all/",
                self.admin_site.admin_view(self.retest_all_view),
                name="problemset_submission_retest_all",
            )
        ]
        return custom + urls

    @admin.action(description="Retest selected submissions (skips verdict=IQ)")
    def retest_selected_submissions(self, request, queryset):
        if not self.has_change_permission(request):
            raise PermissionDenied
        batch_size = int(getattr(settings, "JUDGE_ADMIN_RETEST_BATCH_SIZE", 500))
        selected = queryset.order_by("id")
        ids = list(selected.values_list("id", flat=True)[:batch_size])
        result = queue_retest_submissions(ids)
        remaining = max(selected.count() - len(ids), 0)
        message = (
            f"Queued retest for {result['queued']} submission(s) "
            "(skipping those already in queue)."
        )
        if remaining:
            message += (
                f" {remaining} selected submission(s) were not queued in this batch."
            )
        messages.success(request, message)

    def retest_all_view(self, request):
        if not self.has_change_permission(request):
            raise PermissionDenied

        if request.method == "POST":
            batch_size = int(getattr(settings, "JUDGE_ADMIN_RETEST_BATCH_SIZE", 500))
            result = queue_retest_all_submissions(limit=batch_size)
            message = (
                f"Queued retest for {result['queued']} submission(s) "
                "(skipping those already in queue)."
            )
            remaining = result.get("remaining", 0)
            if remaining:
                message += f" {remaining} still eligible; submit again for next batch."
            messages.success(request, message)
            return redirect("..")

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Retest all submissions",
        }
        return TemplateResponse(
            request, "admin/problemset/submission/retest_all.html", context
        )


@admin.register(JudgeJob)
class JudgeJobAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "submission",
        "status",
        "attempt",
        "claimed_by",
        "lease_expires_at",
        "created_at",
        "finished_at",
    )
    list_filter = ("status",)
    search_fields = ("id", "submission__id", "submission__user__username")
    ordering = ("-id",)
    readonly_fields = (
        "submission",
        "status",
        "attempt",
        "claimed_by",
        "lease_expires_at",
        "last_heartbeat_at",
        "error",
        "created_at",
        "started_at",
        "finished_at",
        "updated_at",
    )
