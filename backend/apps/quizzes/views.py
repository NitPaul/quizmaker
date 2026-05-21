from django.db import transaction
from django.db.models import Count
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from .models import Attempt, AttemptAnswer, Quiz
from .serializers import (
    AttemptCreateSerializer,
    AttemptSerializer,
    LeaderboardSerializer,
    QuizCreateSerializer,
    QuizDetailSerializer,
    QuizListSerializer,
)


def _entry_from_attempt(attempt, rank, is_you):
    user = attempt.user
    display_name = (
        (user.first_name + (" " + user.last_name if user.last_name else "")).strip()
        or user.email.split("@")[0]
    )
    return {
        "rank": rank,
        "user_id": user.id,
        "user_email": user.email,
        "user_display_name": display_name,
        "score": attempt.score,
        "total": attempt.total,
        "percentage": attempt.percentage,
        "duration_seconds": attempt.duration_seconds,
        "finished_at": attempt.finished_at,
        "is_you": is_you,
    }


class QuizViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        qs = Quiz.objects.filter(user=self.request.user)
        if self.action == "list":
            return qs.annotate(question_count=Count("questions"))
        return qs.prefetch_related("questions")

    def get_serializer_class(self):
        if self.action == "list":
            return QuizListSerializer
        if self.action == "create":
            return QuizCreateSerializer
        if self.action == "submit_attempt":
            return AttemptCreateSerializer
        return QuizDetailSerializer

    @extend_schema(
        responses={200: LeaderboardSerializer},
        summary="Top-10 leaderboard for this quiz (best attempt per user)",
    )
    @action(
        detail=True,
        methods=["get"],
        url_path="leaderboard",
        permission_classes=[permissions.IsAuthenticated],
    )
    def leaderboard(self, request, pk=None):
        from django.db import connection

        quiz = get_object_or_404(Quiz, pk=pk)

        # Best attempt per user. Use Postgres DISTINCT ON when available; dedup in Python otherwise.
        if connection.vendor == "postgresql":
            attempts = list(
                Attempt.objects.filter(quiz=quiz)
                .order_by("user_id", "-score", "duration_seconds", "finished_at")
                .distinct("user_id")
                .select_related("user")
            )
        else:
            raw = (
                Attempt.objects.filter(quiz=quiz)
                .order_by("-score", "duration_seconds", "finished_at")
                .select_related("user")
            )
            seen: set[int] = set()
            attempts = []
            for a in raw:
                if a.user_id not in seen:
                    seen.add(a.user_id)
                    attempts.append(a)

        attempts.sort(key=lambda a: (-a.score, a.duration_seconds, a.finished_at))

        top_entries = [
            _entry_from_attempt(a, rank=i + 1, is_you=(a.user_id == request.user.id))
            for i, a in enumerate(attempts[:10])
        ]

        you_entry = None
        for i, a in enumerate(attempts):
            if a.user_id == request.user.id:
                you_entry = _entry_from_attempt(a, rank=i + 1, is_you=True)
                break

        return Response(
            {
                "quiz_id": quiz.id,
                "quiz_title": quiz.title,
                "top": top_entries,
                "you": you_entry,
            }
        )

    @extend_schema(
        request=AttemptCreateSerializer,
        responses={201: AttemptSerializer},
        summary="Submit an attempt for this quiz",
        description=(
            "Scores the attempt server-side and persists each per-question result. "
            "Returns the full attempt with answers for the review screen."
        ),
    )
    @action(detail=True, methods=["post"], url_path="attempts")
    def submit_attempt(self, request, pk=None):
        quiz = self.get_object()
        serializer = AttemptCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        questions = {q.id: q for q in quiz.questions.all()}
        with transaction.atomic():
            attempt = Attempt.objects.create(
                user=request.user,
                quiz=quiz,
                mode=data["mode"],
                total=len(questions),
                duration_seconds=data["duration_seconds"],
            )
            answers = []
            score = 0
            for ans in data["answers"]:
                q = questions.get(ans["question_id"])
                if q is None:
                    continue
                is_correct = ans["user_answer"] == q.correct_answer
                if is_correct:
                    score += 1
                answers.append(
                    AttemptAnswer(
                        attempt=attempt,
                        question=q,
                        user_answer=ans["user_answer"],
                        is_correct=is_correct,
                    )
                )
            AttemptAnswer.objects.bulk_create(answers)
            attempt.score = score
            attempt.save(update_fields=["score"])

        return Response(AttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


class AttemptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = (
            Attempt.objects.filter(user=self.request.user)
            .select_related("quiz")
            .prefetch_related("answers")
        )
        quiz_id = self.request.query_params.get("quiz")
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs
