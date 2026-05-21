"""WSGI config for the quizmaker project."""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "quizmaker.settings.dev")

application = get_wsgi_application()
