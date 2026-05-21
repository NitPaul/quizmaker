from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import generics, permissions, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer
from .tasks import ingest_document


class DocumentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return DocumentUploadSerializer
        return DocumentSerializer

    @extend_schema(
        request={
            "multipart/form-data": DocumentUploadSerializer,
        },
        summary="Upload a PDF and enqueue ingest",
        responses={
            202: OpenApiResponse(
                response=inline_serializer(
                    name="DocumentUploadResponse",
                    fields={
                        "document": DocumentSerializer(),
                        "task_id": serializers.CharField(),
                    },
                )
            )
        },
    )
    def create(self, request, *args, **kwargs):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded = serializer.validated_data["file"]
        title = (serializer.validated_data.get("title") or uploaded.name).strip()[:200]

        document = Document.objects.create(
            user=request.user,
            title=title,
            original_file=uploaded,
        )
        task = ingest_document.delay(document.id)
        return Response(
            {
                "document": DocumentSerializer(document).data,
                "task_id": task.id,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class DocumentDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)
