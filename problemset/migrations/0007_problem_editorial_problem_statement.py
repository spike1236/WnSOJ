# Generated by Django 5.1.5 on 2025-03-19 06:22

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('problemset', '0006_alter_submission_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='problem',
            name='editorial',
            field=models.TextField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='problem',
            name='statement',
            field=models.TextField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
