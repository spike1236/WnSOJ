from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path

from .models import Problem, Category, Submission
from .tasks import retest_all_submissions_task, retest_submissions_task


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    pass


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    pass


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "problem", "user", "language", "verdict", "send_time", "updated_at")
    list_filter = ("verdict", "language", "problem")
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
        ids = list(queryset.values_list("id", flat=True))
        retest_submissions_task.delay(ids)
        messages.success(request, f"Queued retest for {len(ids)} submission(s) (skipping those already in queue).")

    def retest_all_view(self, request):
        if not self.has_change_permission(request):
            raise PermissionDenied

        if request.method == "POST":
            retest_all_submissions_task.delay()
            messages.success(request, "Queued retest for all submissions (skipping those already in queue).")
            return redirect("..")

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Retest all submissions",
        }
        return TemplateResponse(request, "admin/problemset/submission/retest_all.html", context)
