# Generated by Django 5.1.5 on 2025-01-18 15:12

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('short_name', models.CharField(max_length=50)),
                ('long_name', models.CharField(max_length=100)),
                ('img_url', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='Problem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('time_limit', models.FloatField()),
                ('memory_limit', models.IntegerField()),
                ('categories', models.ManyToManyField(related_name='problems', to='problemset.category')),
            ],
        ),
        migrations.CreateModel(
            name='Submission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('verdict', models.CharField(choices=[('In queue', 'In queue'), ('AC', 'Accepted'), ('WA', 'Wrong Answer'), ('TLE', 'Time Limit Exceeded'), ('MLE', 'Memory Limit Exceeded'), ('CE', 'Compilation Error'), ('RE', 'Runtime Error')], default='In queue', max_length=20)),
                ('time', models.IntegerField(default=0)),
                ('memory', models.IntegerField(default=0)),
                ('language', models.CharField(max_length=20)),
                ('send_time', models.DateTimeField(auto_now_add=True)),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='problemset.problem')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
