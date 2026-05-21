from django.urls import path

from .views import GenerateFromDocumentView, GenerateQuizView

urlpatterns = [
    path("generate/", GenerateQuizView.as_view(), name="ai-generate"),
    path("generate-from-document/", GenerateFromDocumentView.as_view(), name="ai-generate-rag"),
]
