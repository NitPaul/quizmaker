from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import APIView

from .serializers import GenerateFromDocumentSerializer, GenerateQuizSerializer
from .tasks import generate_quiz_from_document, generate_quiz_from_text


class GenerateQuizView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GenerateQuizSerializer

    @extend_schema(
        request=GenerateQuizSerializer,
        summary="Enqueue an AI quiz generation task",
        description=(
            "Validates input, enqueues a Celery task, and returns the task id. "
            "Poll GET /api/v1/tasks/{id}/ until status is SUCCESS, then fetch the quiz."
        ),
        responses={
            202: OpenApiResponse(
                response=inline_serializer(
                    name="EnqueueQuizResponse",
                    fields={
                        "task_id": serializers.CharField(),
                        "status_url": serializers.CharField(),
                    },
                )
            ),
        },
    )
    def post(self, request):
        serializer = GenerateQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        task = generate_quiz_from_text.delay(
            user_id=request.user.id,
            text=data["text"],
            num_questions=data["num_questions"],
            title=data.get("title", ""),
            provider_name=data.get("provider") or "groq",
            user_key=data.get("api_key") or None,
        )

        status_url = reverse("v1:task-status", kwargs={"task_id": task.id}, request=request)
        return Response(
            {"task_id": task.id, "status_url": status_url},
            status=status.HTTP_202_ACCEPTED,
        )


class GenerateFromDocumentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GenerateFromDocumentSerializer

    @extend_schema(
        request=GenerateFromDocumentSerializer,
        summary="Generate a RAG-grounded quiz from a user's document",
        description=(
            "Retrieves the top-k relevant chunks from the document for the given topic, "
            "then asks the LLM to write questions grounded in that context. "
            "Poll GET /api/v1/tasks/{id}/ until SUCCESS."
        ),
        responses={
            202: OpenApiResponse(
                response=inline_serializer(
                    name="EnqueueRagQuizResponse",
                    fields={
                        "task_id": serializers.CharField(),
                        "status_url": serializers.CharField(),
                    },
                )
            ),
        },
    )
    def post(self, request):
        # Lazy import: rag app is optional (excluded in test settings).
        from apps.rag.models import Document

        serializer = GenerateFromDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Ensure the doc belongs to the user
        document = Document.objects.filter(
            pk=data["document_id"], user=request.user
        ).first()
        if not document:
            return Response(
                {"detail": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if document.status != Document.Status.READY:
            return Response(
                {"detail": f"Document is not ready (status: {document.status})."},
                status=status.HTTP_409_CONFLICT,
            )

        task = generate_quiz_from_document.delay(
            user_id=request.user.id,
            document_id=document.id,
            topic=data["topic"],
            num_questions=data["num_questions"],
            title=data.get("title", ""),
            provider_name=data.get("provider") or "groq",
            user_key=data.get("api_key") or None,
        )
        status_url = reverse("v1:task-status", kwargs={"task_id": task.id}, request=request)
        return Response(
            {"task_id": task.id, "status_url": status_url},
            status=status.HTTP_202_ACCEPTED,
        )
