from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = (
            "id",
            "title",
            "status",
            "page_count",
            "chunk_count",
            "error_message",
            "created_at",
        )
        read_only_fields = fields


class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = Document
        fields = ("title", "file")

    def validate_file(self, value):
        name = (value.name or "").lower()
        if not name.endswith(".pdf"):
            raise serializers.ValidationError("Only PDF files are supported right now.")
        max_size = 20 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File is too large (max 20 MB).")
        return value
