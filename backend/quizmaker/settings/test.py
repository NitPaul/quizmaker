"""Test settings — fast SQLite in-memory, no rag (pgvector requires Postgres)."""
from .base import *  # noqa: F401, F403

DEBUG = False
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# pgvector requires Postgres; skip RAG models in test runs.
INSTALLED_APPS = [a for a in INSTALLED_APPS if a != "apps.rag"]  # noqa: F405

# Stub credentials so settings load cleanly.
GROQ_API_KEY = "test-groq-key"
GEMINI_API_KEY = "test-gemini-key"

# Run Celery tasks synchronously inside the request — no broker needed.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Speed up password hashing (Django's bcrypt is intentionally slow in prod).
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
