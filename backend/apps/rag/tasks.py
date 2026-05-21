from celery import shared_task
from django.db import transaction

from .embeddings import embed_documents
from .ingest import chunk_text, extract_text_from_pdf
from .models import Document, DocumentChunk


@shared_task(bind=True, name="rag.ingest_document")
def ingest_document(self, document_id: int) -> dict:
    """Extract text from a PDF, chunk it, embed each chunk, and persist.

    Returns: {"document_id": id, "pages": N, "chunks": N}
    Errors propagate so Celery records FAILURE; we also persist `status=failed`
    + `error_message` on the Document for the UI.
    """
    document = Document.objects.get(pk=document_id)
    document.status = Document.Status.PROCESSING
    document.save(update_fields=["status"])

    try:
        text, pages = extract_text_from_pdf(document.original_file.path)
        if not text:
            raise ValueError("No text could be extracted from this PDF.")

        chunks = chunk_text(text)
        if not chunks:
            raise ValueError("PDF text could not be split into chunks.")

        embeddings = embed_documents(chunks)

        with transaction.atomic():
            DocumentChunk.objects.filter(document=document).delete()
            DocumentChunk.objects.bulk_create(
                [
                    DocumentChunk(
                        document=document,
                        chunk_index=i,
                        text=chunk,
                        embedding=embedding,
                    )
                    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
                ]
            )
            document.page_count = pages
            document.chunk_count = len(chunks)
            document.status = Document.Status.READY
            document.error_message = ""
            document.save()

        return {"document_id": document_id, "pages": pages, "chunks": len(chunks)}
    except Exception as exc:
        document.status = Document.Status.FAILED
        document.error_message = str(exc)[:500]
        document.save(update_fields=["status", "error_message"])
        raise
