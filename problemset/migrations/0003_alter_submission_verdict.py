# Generated by Django 5.1.5 on 2025-03-12 17:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('problemset', '0002_submission_code'),
    ]

    operations = [
        migrations.AlterField(
            model_name='submission',
            name='verdict',
            field=models.CharField(choices=[('IQ', 'In queue'), ('AC', 'Accepted'), ('WA', 'Wrong Answer'), ('TLE', 'Time Limit Exceeded'), ('MLE', 'Memory Limit Exceeded'), ('CE', 'Compilation Error'), ('RE', 'Runtime Error')], default='In queue', max_length=20),
        ),
    ]
