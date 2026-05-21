from django.contrib import admin

from .models import Document, DocumentChunk


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "status", "page_count", "chunk_count", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "user__email")
    readonly_fields = ("status", "page_count", "chunk_count", "error_message", "created_at")


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ("document", "chunk_index")
    list_filter = ("document",)
    search_fields = ("text",)
    readonly_fields = ("document", "chunk_index", "text", "embedding")
