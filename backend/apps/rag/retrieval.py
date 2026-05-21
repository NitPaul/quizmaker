"""Cosine-similarity retrieval over DocumentChunk embeddings."""
from pgvector.django import CosineDistance

from .embeddings import embed_query
from .models import DocumentChunk


def retrieve_chunks(document_id: int, query: str, k: int = 8) -> list[DocumentChunk]:
    """Top-k chunks from a document closest to the query embedding."""
    query_vec = embed_query(query)
    return list(
        DocumentChunk.objects.filter(document_id=document_id)
        .annotate(distance=CosineDistance("embedding", query_vec))
        .order_by("distance")[:k]
    )
