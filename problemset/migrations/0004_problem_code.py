# Generated by Django 5.1.5 on 2025-03-16 16:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('problemset', '0003_alter_submission_verdict'),
    ]

    operations = [
        migrations.AddField(
            model_name='problem',
            name='code',
            field=models.CharField(default='', max_length=65536),
        ),
    ]
