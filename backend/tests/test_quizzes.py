import pytest

from apps.quizzes.models import Attempt, Quiz


@pytest.mark.django_db
class TestQuizCreate:
    def test_creates_with_questions(self, authed_client):
        payload = {
            "title": "Geography",
            "source": "csv",
            "randomness": 100,
            "questions": [
                {
                    "text": "Capital of France?",
                    "correct_answer": "Paris",
                    "options": ["Paris", "London", "Madrid", "Berlin"],
                },
            ],
        }
        res = authed_client.post("/api/v1/quizzes/", payload, format="json")
        assert res.status_code == 201
        assert res.data["title"] == "Geography"
        assert len(res.data["questions"]) == 1

    def test_rejects_when_correct_answer_not_in_options(self, authed_client):
        payload = {
            "title": "Bad",
            "source": "csv",
            "randomness": 100,
            "questions": [
                {
                    "text": "Q?",
                    "correct_answer": "Z",
                    "options": ["A", "B", "C", "D"],
                },
            ],
        }
        res = authed_client.post("/api/v1/quizzes/", payload, format="json")
        assert res.status_code == 400

    def test_requires_auth(self, api_client):
        assert api_client.post("/api/v1/quizzes/", {}, format="json").status_code == 401

    def test_rejects_empty_questions(self, authed_client):
        payload = {"title": "T", "source": "csv", "randomness": 100, "questions": []}
        res = authed_client.post("/api/v1/quizzes/", payload, format="json")
        assert res.status_code == 400


@pytest.mark.django_db
class TestQuizList:
    def test_isolated_per_user(self, authed_client, quiz, other_user):
        Quiz.objects.create(user=other_user, title="Other quiz", source="csv")
        res = authed_client.get("/api/v1/quizzes/")
        assert res.status_code == 200
        results = res.data["results"]
        assert len(results) == 1
        assert results[0]["id"] == quiz.id

    def test_question_count_annotated(self, authed_client, quiz):
        res = authed_client.get("/api/v1/quizzes/")
        assert res.data["results"][0]["question_count"] == 2


@pytest.mark.django_db
class TestAttemptSubmit:
    def _payload(self, quiz, **overrides):
        questions = list(quiz.questions.all())
        defaults = {
            "mode": "flashcard",
            "duration_seconds": 30,
            "answers": [
                {"question_id": questions[0].id, "user_answer": "Paris"},
                {"question_id": questions[1].id, "user_answer": "Pacific"},
            ],
        }
        defaults.update(overrides)
        return defaults

    def test_perfect_score(self, authed_client, quiz):
        res = authed_client.post(
            f"/api/v1/quizzes/{quiz.id}/attempts/",
            self._payload(quiz),
            format="json",
        )
        assert res.status_code == 201
        assert res.data["score"] == 2
        assert res.data["total"] == 2
        assert res.data["percentage"] == 100.0

    def test_partial_score(self, authed_client, quiz):
        questions = list(quiz.questions.all())
        payload = {
            "mode": "exam",
            "duration_seconds": 30,
            "answers": [
                {"question_id": questions[0].id, "user_answer": "London"},  # wrong
                {"question_id": questions[1].id, "user_answer": "Pacific"},  # correct
            ],
        }
        res = authed_client.post(f"/api/v1/quizzes/{quiz.id}/attempts/", payload, format="json")
        assert res.status_code == 201
        assert res.data["score"] == 1
        assert res.data["percentage"] == 50.0

    def test_skipped_blank_counts_as_incorrect(self, authed_client, quiz):
        questions = list(quiz.questions.all())
        payload = {
            "mode": "exam",
            "duration_seconds": 30,
            "answers": [
                {"question_id": questions[0].id, "user_answer": ""},
                {"question_id": questions[1].id, "user_answer": "Pacific"},
            ],
        }
        res = authed_client.post(f"/api/v1/quizzes/{quiz.id}/attempts/", payload, format="json")
        assert res.status_code == 201
        assert res.data["score"] == 1

    def test_persists_attempt_and_answers(self, authed_client, user, quiz):
        res = authed_client.post(
            f"/api/v1/quizzes/{quiz.id}/attempts/",
            self._payload(quiz),
            format="json",
        )
        attempt_id = res.data["id"]
        attempt = Attempt.objects.get(pk=attempt_id)
        assert attempt.user_id == user.id
        assert attempt.answers.count() == 2

    def test_requires_auth(self, api_client, quiz):
        res = api_client.post(f"/api/v1/quizzes/{quiz.id}/attempts/", {}, format="json")
        assert res.status_code == 401


@pytest.mark.django_db
class TestLeaderboard:
    def test_returns_best_attempt_per_user(self, authed_client, user, quiz):
        Attempt.objects.create(user=user, quiz=quiz, mode="exam", score=1, total=2, duration_seconds=10)
        Attempt.objects.create(user=user, quiz=quiz, mode="exam", score=2, total=2, duration_seconds=20)

        res = authed_client.get(f"/api/v1/quizzes/{quiz.id}/leaderboard/")
        assert res.status_code == 200
        assert res.data["quiz_id"] == quiz.id
        top = res.data["top"]
        assert len(top) == 1
        assert top[0]["score"] == 2
        assert top[0]["is_you"] is True

    def test_orders_users_by_score_then_duration(self, authed_client, user, other_user, quiz):
        Attempt.objects.create(user=user, quiz=quiz, mode="exam", score=2, total=2, duration_seconds=30)
        Attempt.objects.create(user=other_user, quiz=quiz, mode="exam", score=2, total=2, duration_seconds=10)

        res = authed_client.get(f"/api/v1/quizzes/{quiz.id}/leaderboard/")
        top = res.data["top"]
        assert top[0]["user_id"] == other_user.id
        assert top[0]["rank"] == 1
        assert top[1]["user_id"] == user.id
        assert top[1]["rank"] == 2

    def test_empty_when_no_attempts(self, authed_client, quiz):
        res = authed_client.get(f"/api/v1/quizzes/{quiz.id}/leaderboard/")
        assert res.status_code == 200
        assert res.data["top"] == []
        assert res.data["you"] is None
