import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="test@example.com",
        password="testpass1234",
        first_name="Test",
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email="other@example.com",
        password="otherpass1234",
        first_name="Other",
    )


@pytest.fixture
def authed_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def authed_client_other(api_client, other_user):
    api_client.force_authenticate(user=other_user)
    return api_client


@pytest.fixture
def quiz(db, user):
    from apps.quizzes.models import Question, Quiz

    quiz = Quiz.objects.create(
        user=user,
        title="Test Quiz",
        source="csv",
        randomness=100,
    )
    Question.objects.bulk_create(
        [
            Question(
                quiz=quiz,
                position=0,
                text="Capital of France?",
                correct_answer="Paris",
                options=["Paris", "London", "Madrid", "Berlin"],
            ),
            Question(
                quiz=quiz,
                position=1,
                text="Largest ocean?",
                correct_answer="Pacific",
                options=["Pacific", "Atlantic", "Indian", "Arctic"],
            ),
        ]
    )
    return quiz
