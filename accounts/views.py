from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from .forms import RegisterForm, LoginForm, ChangeIconForm, PasswordChangeForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
import os
from django.conf import settings
from PIL import Image
from .models import User
from problemset.models import Submission
import random
from rest_framework import generics, permissions
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    UserDetailSerializer,
    PublicUserSerializer,
)
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from problemset.serializers import SubmissionListSerializer
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers


def register(request):
    if request.user.is_authenticated:
        return redirect("home")
    if request.method == "POST":
        form = RegisterForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save(commit=False)
            user.account_type = 2 if form.cleaned_data.get("is_business") else 1
            user.icon_id = random.randint(10000000, 99999999)
            if form.cleaned_data.get("icon"):
                icon = form.cleaned_data.get("icon")
                icon64_dir = os.path.join(
                    settings.BASE_DIR, "media", "users_icons", "icon64"
                )
                icon170_dir = os.path.join(
                    settings.BASE_DIR, "media", "users_icons", "icon170"
                )
                os.makedirs(icon64_dir, exist_ok=True)
                os.makedirs(icon170_dir, exist_ok=True)

                icon64_path = os.path.join(icon64_dir, f"{user.icon_id}.png")
                icon170_path = os.path.join(icon170_dir, f"{user.icon_id}.png")

                img = Image.open(icon)
                img = img.resize((64, 64))
                img.save(icon64_path)
                icon.seek(0)
                img170 = Image.open(icon)
                img170 = img170.resize((170, 170))
                img170.save(icon170_path)
            else:
                user.icon_id = -user.icon_id

            user.save()
            login(request, user)
            return redirect("home")
        else:
            messages.error(request, "Please correct the error below.")
    else:
        form = RegisterForm()
    return render(
        request,
        "accounts/register.html",
        {"form": form, "navbar_item_id": -1, "title": "Registration | WnSOJ"},
    )


def user_login(request):
    if request.user.is_authenticated:
        return redirect("home")
    if request.method == "POST":
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = authenticate(
                username=form.cleaned_data.get("username"),
                password=form.cleaned_data.get("password"),
            )
            if user is not None:
                login(request, user)
                return redirect("home")
        messages.error(request, "Invalid username or password.")
    else:
        form = LoginForm()
    return render(
        request,
        "accounts/login.html",
        {
            "form": form,
            "navbar_item_id": -1,
            "title": "Authorization | WnSOJ",
        },
    )


@login_required
def user_logout(request):
    logout(request)
    return redirect("home")


@login_required
def edit_profile(request):
    user = request.user
    if request.method == "POST":
        if "password_change_submit" in request.POST:
            password_form = PasswordChangeForm(user, request.POST)
            if password_form.is_valid():
                user = password_form.save()
                login(request, user)
                messages.success(request, "Password updated successfully.")
                return redirect("edit_profile")
            else:
                messages.error(request, "Please correct the errors below.")
        elif "change_icon_submit" in request.POST:
            icon = request.FILES.get("icon")
            if icon:
                user.icon_id = abs(user.icon_id)
                icon64_dir = os.path.join(
                    settings.BASE_DIR, "media", "users_icons", "icon64"
                )
                icon170_dir = os.path.join(
                    settings.BASE_DIR, "media", "users_icons", "icon170"
                )
                os.makedirs(icon64_dir, exist_ok=True)
                os.makedirs(icon170_dir, exist_ok=True)

                icon64_path = os.path.join(icon64_dir, f"{user.icon_id}.png")
                icon170_path = os.path.join(icon170_dir, f"{user.icon_id}.png")

                img = Image.open(icon)
                img = img.resize((64, 64))
                img.save(icon64_path)

                icon.seek(0)
                img170 = Image.open(icon)
                img170 = img170.resize((170, 170))
                img170.save(icon170_path)

                messages.success(request, "Icon updated successfully.")
                return redirect("edit_profile")

    return render(
        request,
        "accounts/edit_profile.html",
        {
            "user": user,
            "navbar_item_id": -1,
            "title": "Edit Profile | WnSOJ",
            "change_icon_form": ChangeIconForm(),
            "password_change_form": PasswordChangeForm(user),
        },
    )


def profile(request, username):
    user = get_object_or_404(User, username=username)

    params = {
        "navbar_item_id": -1,
        "title": f"{user.username}'s profile | WnSOJ",
        "profile_user": user,
    }

    submissions = Submission.objects.filter(user_id=user.id).order_by("-id")
    all_submissions = list(submissions)
    params["submissions"] = all_submissions[:10]

    params["cnt"] = {"AC": 0, "CE": 0, "WA": 0, "TLE": 0, "MLE": 0, "RE": 0}

    for submission in all_submissions:
        if submission.verdict == "IQ":
            continue
        params["cnt"][submission.verdict.split()[0]] += 1

    return render(request, "accounts/profile.html", params)


class RegisterAPIView(generics.CreateAPIView):
    """
    API view to register users.
    """

    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class UserDetailAPIView(generics.RetrieveUpdateAPIView):
    """
    API view to retrieve and update user details.
    Only the authenticated user can access their own details.
    """

    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_object(self):
        return self.request.user


class LogoutAPIView(APIView):
    """Blacklist (revoke) a refresh token.

    Expected payload: {"refresh": "<refresh_token>"}
    """

    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        request=inline_serializer(
            name="LogoutRequest",
            fields={
                "refresh": drf_serializers.CharField(),
            },
        ),
        responses={
            205: None,
            400: inline_serializer(
                name="LogoutError",
                fields={"detail": drf_serializers.CharField()},
            ),
        },
    )
    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "Missing refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "Invalid refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_205_RESET_CONTENT)


class PublicUserProfileAPIView(APIView):
    """Public profile data for a given user.

    This is intended for Next.js pages to fetch JSON instead of parsing HTML.
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=None,
        responses=inline_serializer(
            name="PublicUserProfileResponse",
            fields={
                "user": PublicUserSerializer(),
                "stats": inline_serializer(
                    name="PublicUserProfileStats",
                    fields={
                        "verdict_counts": drf_serializers.DictField(
                            child=drf_serializers.IntegerField()
                        )
                    },
                ),
                "recent_submissions": SubmissionListSerializer(many=True),
            },
        ),
    )
    def get(self, request, username: str):
        user = get_object_or_404(User, username=username)

        submissions_qs = (
            Submission.objects.filter(user=user)
            .select_related("problem")
            .order_by("-id")
        )
        recent = submissions_qs[:10]

        cnt = {"AC": 0, "CE": 0, "WA": 0, "TLE": 0, "MLE": 0, "RE": 0}
        for verdict in submissions_qs.exclude(verdict="IQ").values_list(
            "verdict", flat=True
        ):
            code = (verdict or "").split()[0]
            if code in cnt:
                cnt[code] += 1

        return Response(
            {
                "user": PublicUserSerializer(user).data,
                "stats": {"verdict_counts": cnt},
                "recent_submissions": SubmissionListSerializer(recent, many=True).data,
            }
        )


class PublicUserSubmissionsAPIView(generics.ListAPIView):
    """Public submissions list for a specific user.

    Uses the compact submission serializer (does not expose source code).
    Supports optional filters: ?verdict=AC and/or ?problem_id=123
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = SubmissionListSerializer

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs["username"])
        qs = (
            Submission.objects.filter(user=user)
            .select_related("user", "problem")
            .order_by("-id")
        )

        verdict = self.request.query_params.get("verdict")
        if verdict:
            qs = qs.filter(verdict__startswith=verdict)

        problem_id = self.request.query_params.get("problem_id")
        if problem_id:
            try:
                qs = qs.filter(problem_id=int(problem_id))
            except (TypeError, ValueError):
                pass

        return qs
