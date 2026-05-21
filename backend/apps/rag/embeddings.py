"""Gemini embeddings wrapper.

Uses the server's GEMINI_API_KEY with `gemini-embedding-001`, truncated to 768
dimensions to match the pgvector column.
"""
from django.conf import settings

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768
BATCH_SIZE = 50


class EmbeddingsError(Exception):
    pass


def _client():
    if not settings.GEMINI_API_KEY:
        raise EmbeddingsError(
            "GEMINI_API_KEY is required for embeddings. Set it in your .env."
        )
    from google import genai

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _embed(texts: list[str], task_type: str) -> list[list[float]]:
    if not texts:
        return []
    client = _client()
    out: list[list[float]] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=batch,
                config={
                    "task_type": task_type,
                    "output_dimensionality": EMBEDDING_DIM,
                },
            )
        except Exception as exc:
            raise EmbeddingsError(f"Embedding call failed: {exc}") from exc
        out.extend(e.values for e in response.embeddings)
    return out


def embed_documents(texts: list[str]) -> list[list[float]]:
    """Embed passages for storage."""
    return _embed(texts, task_type="RETRIEVAL_DOCUMENT")


def embed_query(query: str) -> list[float]:
    """Embed a search query."""
    return _embed([query], task_type="RETRIEVAL_QUERY")[0]
