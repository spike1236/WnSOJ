from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from .forms import RegisterForm, LoginForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
import os
from django.conf import settings
from django.core.files.storage import FileSystemStorage


def register(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        form = RegisterForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save(commit=False)
            user.account_type = 1 if form.cleaned_data.get('is_business') else 0
            if form.cleaned_data.get('icon'):
                icon = form.cleaned_data.get('icon')
                fs = FileSystemStorage(location=os.path.join(settings.BASE_DIR,
                                                             'media',
                                                             'users_icons',
                                                             'icon64'))
                filename = fs.save(f'icon64_user_{user.icon_id}.png', icon)
                # Resize image using PIL
                from PIL import Image
                img = Image.open(fs.path(filename))
                img = img.resize((64, 64))
                img.save(fs.path(filename))

                # Similarly for icon170
                fs_170 = FileSystemStorage(location=os.path.join(settings.BASE_DIR,
                                                                 'media',
                                                                 'users_icons',
                                                                 'icon170'))
                icon.seek(0)
                filename_170 = fs_170.save(f'icon170_user_{user.icon_id}.png', icon)
                img170 = Image.open(fs_170.path(filename_170))
                img170 = img170.resize((170, 170))
                img170.save(fs_170.path(filename_170))
            user.save()
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, "Please correct the error below.")
    else:
        form = RegisterForm()
    return render(request, 'accounts/register.html', {'form': form,
                                                      'navbar_item_id': -1,
                                                      'title': 'Registration | WnSOJ'})


def user_login(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = authenticate(username=form.cleaned_data.get('username'),
                                password=form.cleaned_data.get('password'))
            if user is not None:
                login(request, user)
                return redirect('home')
        messages.error(request, "Invalid username or password.")
    else:
        form = LoginForm()
    return render(request, 'accounts/login.html', {'form': form, 'navbar_item_id': -1,
                                                   'title': 'Authorization | WnSOJ'})


@login_required
def user_logout(request):
    logout(request)
    return redirect('home')


@login_required
def edit_profile(request):
    user = request.user
    if request.method == 'POST':
        if 'password_change_submit' in request.POST:
            old_password = request.POST.get('old_password')
            new_password = request.POST.get('password')
            new_password_repeat = request.POST.get('password_repeat')
            if not user.check_password(old_password):
                messages.error(request, "Old password is incorrect.")
            elif new_password != new_password_repeat:
                messages.error(request, "Passwords do not match.")
            elif len(new_password) < 8:
                messages.error(request, "Password is too short.")
            else:
                user.set_password(new_password)
                user.save()
                login(request, user)
                messages.success(request, "Password updated successfully.")
                return redirect('edit_profile')
        elif 'icon_change_submit' in request.POST:
            icon = request.FILES.get('icon')
            if icon:
                fs = FileSystemStorage(location=os.path.join(settings.BASE_DIR,
                                                             'static',
                                                             'users_icons',
                                                             'icon64'))
                filename = fs.save(f'icon64_user_{user.icon_id}.png', icon)
                from PIL import Image
                img = Image.open(fs.path(filename))
                img = img.resize((64, 64))
                img.save(fs.path(filename))

                fs_170 = FileSystemStorage(location=os.path.join(settings.BASE_DIR,
                                                                 'static',
                                                                 'users_icons',
                                                                 'icon170'))
                icon.seek(0)
                filename_170 = fs_170.save(f'icon170_user_{user.icon_id}.png', icon)
                img170 = Image.open(fs_170.path(filename_170))
                img170 = img170.resize((170, 170))
                img170.save(fs_170.path(filename_170))
                messages.success(request, "Icon updated successfully.")
                return redirect('edit_profile')
    return render(request, 'accounts/edit_profile.html', {
        'user': user,
        'navbar_item_id': -1,
        'title': 'Edit Profile | WnSOJ'
    })
