from django.contrib.auth import get_user_model
from django.db.models import Sum
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import generics, permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class MeStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Aggregated stats for the current user",
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="UserStatsResponse",
                    fields={
                        "quizzes_count": serializers.IntegerField(),
                        "attempts_count": serializers.IntegerField(),
                        "documents_count": serializers.IntegerField(),
                        "total_correct": serializers.IntegerField(),
                        "total_questions": serializers.IntegerField(),
                        "avg_percentage": serializers.FloatField(),
                        "best_percentage": serializers.FloatField(),
                    },
                )
            )
        },
    )
    def get(self, request):
        from django.conf import settings as dj_settings

        from apps.quizzes.models import Attempt, Quiz

        user = request.user
        attempts_qs = Attempt.objects.filter(user=user)
        agg = attempts_qs.aggregate(
            total_correct=Sum("score"),
            total_questions=Sum("total"),
        )
        total_correct = agg["total_correct"] or 0
        total_questions = agg["total_questions"] or 0
        avg_percentage = (
            round(total_correct / total_questions * 100, 1) if total_questions else 0.0
        )
        best_percentage = 0.0
        if attempts_qs.exists():
            best_percentage = max(
                (a.percentage for a in attempts_qs.only("score", "total")), default=0.0
            )

        documents_count = 0
        if "apps.rag" in dj_settings.INSTALLED_APPS:
            from apps.rag.models import Document

            documents_count = Document.objects.filter(user=user).count()

        return Response(
            {
                "quizzes_count": Quiz.objects.filter(user=user).count(),
                "attempts_count": attempts_qs.count(),
                "documents_count": documents_count,
                "total_correct": total_correct,
                "total_questions": total_questions,
                "avg_percentage": avg_percentage,
                "best_percentage": best_percentage,
            }
        )
