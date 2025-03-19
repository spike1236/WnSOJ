from django.shortcuts import render, redirect, get_object_or_404
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


def categories(request):
    return render(request, 'problemset/problems_list.html', {
        'title': 'Problems | WnSOJ',
        'navbar_item_id': 2,
        'categories': list(models.Category.objects.all()),
        'show_categories': True
    })


def problems(request, category):
    problems = models.Problem.objects.filter(categories__short_name=category)
    cat = models.Category.objects.get(short_name=category)
    return render(request, 'problemset/problems_list.html', {
        'title': f'{cat.long_name} | WnSOJ',
        'navbar_item_id': 2,
        'problems': list(problems)
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
                title=form.cleaned_data['title'],
                statement=form.cleaned_data['statement'],
                editorial=form.cleaned_data['editorial'],
                code=form.cleaned_data['solution']
            )
            problem.save()

            os.makedirs(f'data/problems/{problem.id}', exist_ok=True)
            with ZipFile(BytesIO(request.FILES['test_data'].read()), 'r') as file:
                file.extractall(f'data/problems/{problem.id}')

            selected_categories = form.cleaned_data['categories']
            for category in selected_categories:
                problem.categories.add(category)

            problem.categories.add(models.Category.objects.get(short_name='problemset'))

            return redirect('problems')

    context = {
        'title': 'Add Problem | WnSOJ',
        'navbar_item_id': 2,
        'form': form
    }

    return render(request, 'problemset/add_problem.html', context)


def problem_statement(request, problem_id):
    problem = get_object_or_404(models.Problem, id=problem_id)
    form = SubmitForm()
    if request.method == "POST":
        form = SubmitForm(request.POST, request.FILES)
        print(form.is_bound, form.errors)
        if form.is_valid():
            if request.user.is_authenticated:
                submission = models.Submission(
                    problem=problem,
                    user=request.user,
                    language=form.cleaned_data['language'],
                    code=form.cleaned_data['code'],
                    verdict='IQ'
                )
                submission.save()
                username = request.user.username
                return redirect(f'/problem/{problem_id}/submissions?user={username}')
            else:
                return redirect('login')
    return render(request, 'problemset/problem.html', {
        'title': f'{problem.title} | WnSOJ',
        'current_bar_id': 1,
        'navbar_item_id': 2,
        'problem': problem,
        'form': form
    })


def problem_editorial(request, problem_id):
    problem = get_object_or_404(models.Problem, id=problem_id)
    return render(request, 'problemset/editorial.html', {
        'title': f'{problem.title} | WnSOJ',
        'navbar_item_id': 2,
        'current_bar_id': 2,
        'problem': problem
    })


def problem_submissions_list(request, problem_id):
    problem = get_object_or_404(models.Problem, id=problem_id)
    submissions = models.Submission.objects.filter(problem=problem)

    if 'user' in request.GET and request.GET['user']:
        submissions = submissions.filter(user__username=request.GET['user'])

    if 'verdict' in request.GET and request.GET['verdict']:
        submissions = submissions.filter(verdict=request.GET['verdict'])

    submissions = submissions.order_by('-id')[:10]

    return render(request, 'problemset/problem_submissions.html', {
        'title': 'Submissions | WnSOJ',
        'navbar_item_id': 2,
        'submissions': list(submissions),
        'problem': problem,
        'current_bar_id': 3
    })


def submissions(request):
    submissions = models.Submission.objects.all()

    if 'user' in request.GET and request.GET['user']:
        submissions = submissions.filter(user__username=request.GET['user'])

    if 'verdict' in request.GET and request.GET['verdict']:
        submissions = submissions.filter(verdict=request.GET['verdict'])

    submissions = submissions.order_by('-id')[:10]

    return render(request, 'problemset/submissions_list.html', {
        'title': 'Submissions | WnSOJ',
        'navbar_item_id': 2,
        'submissions': list(submissions)
    })


def submission(request, submission_id):
    submission = get_object_or_404(models.Submission, id=submission_id)
    return render(request, 'problemset/submission.html', {
        'title': 'Submission | WnSOJ',
        'navbar_item_id': 2,
        'item': submission
    })


def faq(request):
    return render(request, 'faq.html', {
        'title': 'FAQ | WnSOJ',
        'navbar_item_id': 4
    })
