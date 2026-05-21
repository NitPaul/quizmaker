import pytest


@pytest.mark.django_db
class TestRegister:
    def test_creates_user(self, api_client):
        res = api_client.post(
            "/api/v1/auth/register/",
            {"email": "new@example.com", "password": "secure1234", "first_name": "New"},
            format="json",
        )
        assert res.status_code == 201
        assert res.data["email"] == "new@example.com"
        assert "password" not in res.data

    def test_short_password_rejected(self, api_client):
        res = api_client.post(
            "/api/v1/auth/register/",
            {"email": "new@example.com", "password": "short"},
            format="json",
        )
        assert res.status_code == 400

    def test_duplicate_email_rejected(self, api_client, user):
        res = api_client.post(
            "/api/v1/auth/register/",
            {"email": user.email, "password": "secure1234"},
            format="json",
        )
        assert res.status_code == 400


@pytest.mark.django_db
class TestLogin:
    def test_returns_token_pair(self, api_client, user):
        res = api_client.post(
            "/api/v1/auth/login/",
            {"email": user.email, "password": "testpass1234"},
            format="json",
        )
        assert res.status_code == 200
        assert "access" in res.data
        assert "refresh" in res.data

    def test_wrong_password_rejected(self, api_client, user):
        res = api_client.post(
            "/api/v1/auth/login/",
            {"email": user.email, "password": "wrong"},
            format="json",
        )
        assert res.status_code == 401

    def test_unknown_email_rejected(self, api_client):
        res = api_client.post(
            "/api/v1/auth/login/",
            {"email": "nobody@example.com", "password": "anything"},
            format="json",
        )
        assert res.status_code == 401


@pytest.mark.django_db
class TestMe:
    def test_anonymous_blocked(self, api_client):
        assert api_client.get("/api/v1/auth/me/").status_code == 401

    def test_returns_current_user(self, authed_client, user):
        res = authed_client.get("/api/v1/auth/me/")
        assert res.status_code == 200
        assert res.data["email"] == user.email
        assert res.data["first_name"] == "Test"


@pytest.mark.django_db
class TestMeStats:
    def test_zero_for_new_user(self, authed_client):
        res = authed_client.get("/api/v1/auth/me/stats/")
        assert res.status_code == 200
        assert res.data["quizzes_count"] == 0
        assert res.data["attempts_count"] == 0
        assert res.data["avg_percentage"] == 0

    def test_aggregates_from_attempts(self, authed_client, user, quiz):
        from apps.quizzes.models import Attempt

        Attempt.objects.create(user=user, quiz=quiz, mode="exam", score=1, total=2)
        Attempt.objects.create(user=user, quiz=quiz, mode="exam", score=2, total=2)

        res = authed_client.get("/api/v1/auth/me/stats/")
        assert res.status_code == 200
        assert res.data["quizzes_count"] == 1
        assert res.data["attempts_count"] == 2
        assert res.data["total_correct"] == 3
        assert res.data["total_questions"] == 4
        assert res.data["avg_percentage"] == 75.0
        assert res.data["best_percentage"] == 100.0
