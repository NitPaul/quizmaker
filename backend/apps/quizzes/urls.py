from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AttemptViewSet, QuizViewSet

router = DefaultRouter()
router.register("quizzes", QuizViewSet, basename="quiz")
router.register("attempts", AttemptViewSet, basename="attempt")

urlpatterns = [
    path("", include(router.urls)),
]
