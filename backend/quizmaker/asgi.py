"""ASGI config for the quizmaker project."""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "quizmaker.settings.dev")

application = get_asgi_application()
