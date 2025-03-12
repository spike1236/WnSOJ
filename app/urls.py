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
from django.urls import path
from problemset import views as problem_views
from jobboard import views as job_views
from accounts import views as accounts_views
from . import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', problem_views.home_page, name='home'),
    path('home/', problem_views.home_page, name='home'),
    path('register/', accounts_views.register, name='register'),
    path('login/', accounts_views.user_login, name='login'),
    path('logout/', accounts_views.user_logout, name='logout'),
    path('edit_profile/', accounts_views.edit_profile, name='edit_profile'),
    path('profile/<username>/', accounts_views.profile, name='profile'),
    path('problems/', problem_views.problems, name='problems'),
    path('add_problem/', problem_views.add_problem, name='add_problem'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
