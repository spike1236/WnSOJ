from django.shortcuts import render, redirect
from django.urls import path
from django.templatetags.static import static
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from . import models
from .forms import AddProblemForm, SubmitForm
import os
from zipfile import ZipFile
from io import BytesIO


def home_page(request):
    return render(request, 'index.html', {
        'title': 'Home | WnSOJ',
        'navbar_item_id': 1,
        'card1': static('img/main_page_card1.svg'),
        'card2': static('img/main_page_card2.svg'),
        'card3': static('img/main_page_card3.svg')
    })


def problems(request):
    categories = list(models.Category.objects.all())
    return render(request, 'problemset/problems_list.html', {
        'title': 'Problems | WnSOJ',
        'navbar_item_id': 2,
        'categories': categories,
        'show_categories': True
    })


@login_required
def add_problem(request):
    if request.user.account_type == 1:
        return HttpResponseForbidden()

    form = AddProblemForm()
    if request.method == "POST":
        form = AddProblemForm(request.POST, request.FILES)
        if form.is_valid():
            problem = models.Problem(
                time_limit=form.cleaned_data['time_limit'],
                memory_limit=form.cleaned_data['memory_limit'],
                title=form.cleaned_data['title']
            )
            problem.save()

            os.makedirs(f'data/problems/{problem.id}', exist_ok=True)
            with ZipFile(BytesIO(request.FILES['test_data'].read()), 'r') as file:
                file.extractall(f'data/problems/{problem.id}')

            os.makedirs(f'templates/problems/{problem.id}', exist_ok=True)

            statement_file = request.FILES['statement']
            statement_content = statement_file.read().decode('utf-8', errors='strict')
            with open(f'templates/problems/{problem.id}/statement.html', 'wb') as file:
                file.write('\n'.join([line.rstrip('\n') for line in
                                      statement_content.split('\n')]).encode('utf-8'))

            editorial_file = request.FILES['editorial']
            editorial_content = editorial_file.read().decode('utf-8', errors='strict')
            with open(f'templates/problems/{problem.id}/editorial.html', 'wb') as file:
                file.write('\n'.join([line.rstrip('\n') for line in
                                      editorial_content.split('\n')]).encode('utf-8'))

            cats = form.cleaned_data['category'].split(', ')
            for sn_cat in cats:
                try:
                    cat = models.Category.objects.get(short_name=sn_cat)
                    problem.categories.add(cat)
                except models.Category.DoesNotExist:
                    pass
            return redirect('problems')

    context = {
        'title': 'Add Problem | WnSOJ',
        'navbar_item_id': 2,
        'form': form
    }

    return render(request, 'problemset/add_problem.html', context)


