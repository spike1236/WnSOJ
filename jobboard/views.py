from django.shortcuts import render, redirect, get_object_or_404
from .models import Job
from .forms import AddJobForm


def format_number(value):
    """Format large numbers with k (thousands) or M (millions) suffix."""
    try:
        value = float(value)
        if value >= 1000000000:
            return f"{value / 1000000000:.1f}B".replace('.0B', 'B')
        if value >= 1000000:
            return f"{value / 1000000:.1f}M".replace('.0M', 'M')
        elif value >= 1000:
            return f"{value / 1000:.1f}k".replace('.0k', 'k')
        else:
            return str(int(value))
    except (ValueError, TypeError):
        return str(value)


def jobs(request):
    jobs = Job.objects.all()
    return render(request, 'jobboard/jobs.html', {
        'title': 'Jobs | WnSOJ',
        'navbar_item_id': 3,
        'jobs': jobs,
        'format_number': format_number
    })


def add_job(request):
    if request.method == 'POST':
        form = AddJobForm(request.POST)
        if form.is_valid() and request.user.account_type != 1:
            min_salary = request.POST.get('min_salary', '')
            max_salary = request.POST.get('max_salary', '')
            currency = request.POST.get('currency', '$')

            salary_error = None
            if min_salary and max_salary and float(min_salary) > float(max_salary):
                salary_error = "Minimum salary cannot be greater than maximum salary."

            if not salary_error:
                job = form.save(commit=False)
                job.user = request.user

                salary_range = {}
                if min_salary:
                    salary_range['min'] = min_salary
                else:
                    salary_range['min'] = 0

                if max_salary:
                    salary_range['max'] = max_salary

                salary_range['currency'] = currency

                job.salary_range = salary_range
                job.save()
                return redirect('jobs')
            else:
                return render(request, 'jobboard/add_job.html', {
                    'title': 'Add Job | WnSOJ',
                    'navbar_item_id': 3,
                    'form': form,
                    'min_salary': min_salary,
                    'max_salary': max_salary,
                    'currency': currency,
                    'salary_error': salary_error
                })
    else:
        form = AddJobForm()
    return render(request, 'jobboard/add_job.html', {
        'title': 'Add Job | WnSOJ',
        'navbar_item_id': 3,
        'form': form
    })


def job(request, job_id):
    job = Job.objects.get(id=job_id)
    return render(request, 'jobboard/job.html', {
        'title': job.title + ' | WnSOJ',
        'navbar_item_id': 3,
        'job': job,
        'format_number': format_number
    })


def edit_job(request, job_id):
    job = get_object_or_404(Job, id=job_id)

    if not request.user.is_authenticated or request.user.account_type == 1 or (
        request.user != job.user and request.user.account_type == 2
        ):
        return redirect('job', job_id=job_id)

    min_salary = job.salary_range.get('min', '') if job.salary_range else ''
    max_salary = job.salary_range.get('max', '') if job.salary_range else ''
    currency = job.salary_range.get('currency', '$') if job.salary_range else '$'

    if request.method == 'POST':
        form = AddJobForm(request.POST, instance=job)
        if form.is_valid():
            min_salary = request.POST.get('min_salary', '')
            max_salary = request.POST.get('max_salary', '')
            currency = request.POST.get('currency', '$')

            salary_error = None
            if min_salary and max_salary and float(min_salary) > float(max_salary):
                salary_error = "Minimum salary cannot be greater than maximum salary."

            if not salary_error:
                job_instance = form.save(commit=False)

                salary_range = {}
                if min_salary:
                    salary_range['min'] = min_salary
                else:
                    salary_range['min'] = 0

                if max_salary:
                    salary_range['max'] = max_salary

                salary_range['currency'] = currency

                job_instance.salary_range = salary_range
                job_instance.save()
                return redirect('job', job_id=job_id)
            else:
                return render(request, 'jobboard/add_job.html', {
                    'title': f'Edit {job.title} | WnSOJ',
                    'navbar_item_id': 3,
                    'form': form,
                    'job': job,
                    'min_salary': min_salary,
                    'max_salary': max_salary,
                    'currency': currency,
                    'is_edit': True,
                    'salary_error': salary_error
                })
    else:
        form = AddJobForm(instance=job)

    return render(request, 'jobboard/add_job.html', {
        'title': f'Edit {job.title} | WnSOJ',
        'navbar_item_id': 3,
        'form': form,
        'job': job,
        'min_salary': min_salary,
        'max_salary': max_salary,
        'currency': currency,
        'is_edit': True
    })


def delete_job(request, job_id):
    job = get_object_or_404(Job, id=job_id)
    if not request.user.is_authenticated or request.user.account_type == 1 or (
        request.user != job.user and request.user.account_type == 2
    ):
        return redirect('job', job_id=job_id)
    job.delete()
    return redirect('jobs')
