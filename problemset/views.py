from django.shortcuts import render
from django.urls import path
from django.templatetags.static import static


def home_page(request):
    context = {
        'title': 'Home | WnSOJ',
        'navbar_item_id': 1,
        'card1': static('img/main_page_card1.svg'),
        'card2': static('img/main_page_card2.svg'),
        'card3': static('img/main_page_card3.svg')
    }
    return render(request, 'index.html', context)
