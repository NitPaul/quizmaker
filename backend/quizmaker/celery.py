"""Celery application setup."""
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "quizmaker.settings.dev")

app = Celery("quizmaker")

# All Celery configuration keys prefixed with CELERY_ in Django settings.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Discover @shared_task functions in every installed app's tasks.py
app.autodiscover_tasks()
