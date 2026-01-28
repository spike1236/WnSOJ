"""
URL configuration for app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from accounts import views as accounts_views
from problemset import views as problem_views
from jobboard import views as job_views
from . import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

router = DefaultRouter()
router.register(r'categories', problem_views.CategoryAPIViewSet)
router.register(r'problems', problem_views.ProblemAPIViewSet)
router.register(r'submissions', problem_views.SubmissionAPIViewSet)
router.register(r'jobs', job_views.JobAPIViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', problem_views.home_page, name='home'),
    path('home/', problem_views.home_page, name='home'),
    path('register/', accounts_views.register, name='register'),
    path('login/', accounts_views.user_login, name='login'),
    path('logout/', accounts_views.user_logout, name='logout'),
    path('edit_profile/', accounts_views.edit_profile, name='edit_profile'),
    path('profile/<username>/', accounts_views.profile, name='profile'),
    path('problems/', problem_views.categories, name='problems'),
    path('add_problem/', problem_views.add_problem, name='add_problem'),
    path('problem/<int:problem_id>/', problem_views.problem_statement, name='problem_statement'),
    path('problem/<int:problem_id>/editorial/', problem_views.problem_editorial, name='problem_editorial'),
    path('problems/<category>/', problem_views.problems, name='problems'),
    path('problem/<int:problem_id>/submissions/', problem_views.problem_submissions_list, name='problem_submissions_list'),
    path('submissions/', problem_views.submissions, name='submissions'),
    path('submission/<int:submission_id>/', problem_views.submission, name='submission'),
    path('faq/', problem_views.faq, name='faq'),
    path('jobs/', job_views.jobs, name='jobs'),
    path('add_job/', job_views.add_job, name='add_job'),
    path('job/<int:job_id>/', job_views.job, name='job'),
    path('job/<int:job_id>/edit/', job_views.edit_job, name='edit_job'),
    path('job/<int:job_id>/delete/', job_views.delete_job, name='delete_job'),
    path('api/csrf/', accounts_views.CsrfAPIView.as_view(), name='csrf_api'),
    path('api/session/login/', accounts_views.SessionLoginAPIView.as_view(), name='session_login_api'),
    path('api/session/logout/', accounts_views.SessionLogoutAPIView.as_view(), name='session_logout_api'),
    path('api/session/register/', accounts_views.SessionRegisterAPIView.as_view(), name='session_register_api'),
    path('api/register/', accounts_views.RegisterAPIView.as_view(), name='register_api'),
    path('api/profile/', accounts_views.UserDetailAPIView.as_view(), name='profile_api'),
    path('api/profile/icon/', accounts_views.ProfileIconAPIView.as_view(), name='profile_icon_api'),
    path('api/profile/password/', accounts_views.ProfilePasswordAPIView.as_view(), name='profile_password_api'),
    path('api/users/<str:username>/', accounts_views.PublicUserProfileAPIView.as_view(), name='public_user_profile_api'),
    path('api/users/<str:username>/submissions/', accounts_views.PublicUserSubmissionsAPIView.as_view(), name='public_user_submissions_api'),
    path('api/', include(router.urls)),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
