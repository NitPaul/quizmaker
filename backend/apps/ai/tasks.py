from celery import shared_task
from django.db import transaction

from apps.quizzes.models import Question, Quiz

from .providers import resolve_provider


def _rag_prompt_context(chunks) -> str:
    return "\n\n".join(f"[Chunk {c.chunk_index}]\n{c.text}" for c in chunks)


@shared_task(bind=True, name="ai.generate_quiz_from_text")
def generate_quiz_from_text(
    self,
    *,
    user_id: int,
    text: str,
    num_questions: int,
    title: str,
    provider_name: str,
    user_key: str | None,
) -> dict:
    """Generate a quiz from pasted text and persist it.

    Returns: {"quiz_id": <int>}
    Errors propagate so Celery records FAILURE with the message.
    """
    provider = resolve_provider(provider_name, user_key)
    questions = provider.generate_quiz(text, num_questions)

    with transaction.atomic():
        quiz = Quiz.objects.create(
            user_id=user_id,
            title=(title or "AI generated quiz").strip()[:200],
            source=Quiz.Source.AI_TEXT,
            randomness=100,
        )
        Question.objects.bulk_create(
            [
                Question(
                    quiz=quiz,
                    position=i,
                    text=q["text"],
                    correct_answer=q["correct_answer"],
                    options=q["options"],
                )
                for i, q in enumerate(questions)
            ]
        )

    return {"quiz_id": quiz.id}


@shared_task(bind=True, name="ai.generate_quiz_from_document")
def generate_quiz_from_document(
    self,
    *,
    user_id: int,
    document_id: int,
    topic: str,
    num_questions: int,
    title: str,
    provider_name: str,
    user_key: str | None,
) -> dict:
    """Retrieve top-k chunks for the topic, generate quiz grounded in them."""
    from apps.rag.models import Document
    from apps.rag.retrieval import retrieve_chunks

    document = Document.objects.get(pk=document_id)
    if document.status != Document.Status.READY:
        raise ValueError(
            f"Document is not ready (status: {document.status}). "
            "Wait for ingest to complete."
        )

    chunks = retrieve_chunks(document_id, topic, k=8)
    if not chunks:
        raise ValueError("No relevant chunks found for that topic.")

    context = _rag_prompt_context(chunks)
    provider = resolve_provider(provider_name, user_key)
    questions = provider.generate_quiz(context, num_questions)

    with transaction.atomic():
        quiz = Quiz.objects.create(
            user_id=user_id,
            title=(title or f"Quiz from {document.title}").strip()[:200],
            source=Quiz.Source.AI_RAG,
            randomness=100,
        )
        Question.objects.bulk_create(
            [
                Question(
                    quiz=quiz,
                    position=i,
                    text=q["text"],
                    correct_answer=q["correct_answer"],
                    options=q["options"],
                )
                for i, q in enumerate(questions)
            ]
        )

    return {"quiz_id": quiz.id, "document_id": document_id, "chunks_used": len(chunks)}
