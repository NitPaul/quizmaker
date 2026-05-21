from django.conf import settings
from django.db import models


class Quiz(models.Model):
    class Source(models.TextChoices):
        CSV = "csv", "CSV/XLSX upload"
        AI_TEXT = "ai_text", "AI from pasted text"
        AI_RAG = "ai_rag", "AI from RAG document"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quizzes",
    )
    title = models.CharField(max_length=200)
    source = models.CharField(max_length=20, choices=Source.choices)
    randomness = models.PositiveSmallIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    position = models.PositiveIntegerField()
    text = models.TextField()
    correct_answer = models.CharField(max_length=500)
    options = models.JSONField(default=list)

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["quiz", "position"], name="unique_quiz_position"),
        ]

    def __str__(self) -> str:
        return f"Q{self.position}: {self.text[:60]}"


class Attempt(models.Model):
    class Mode(models.TextChoices):
        FLASHCARD = "flashcard", "Flashcard"
        EXAM = "exam", "Exam"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    mode = models.CharField(max_length=20, choices=Mode.choices)
    score = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField()
    duration_seconds = models.PositiveIntegerField(default=0)
    finished_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-finished_at"]
        indexes = [models.Index(fields=["quiz", "-score"])]

    def __str__(self) -> str:
        return f"{self.user_id} · {self.quiz_id} · {self.score}/{self.total}"

    @property
    def percentage(self) -> float:
        return round(self.score / self.total * 100, 1) if self.total else 0.0


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    user_answer = models.CharField(max_length=500, blank=True)
    is_correct = models.BooleanField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"], name="unique_attempt_question"
            ),
        ]

    def __str__(self) -> str:
        return f"answer {self.id} · {'correct' if self.is_correct else 'wrong'}"
