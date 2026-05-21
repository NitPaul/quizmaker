"""LLM provider abstraction.

Provides a unified interface for quiz generation across multiple LLM providers
(Groq, Gemini). Server-side keys can be overridden per-request by a user-supplied key.
"""
from __future__ import annotations

import json
from abc import ABC, abstractmethod
from typing import TypedDict

from django.conf import settings


class QuestionDict(TypedDict):
    text: str
    correct_answer: str
    options: list[str]


class ProviderError(Exception):
    """Raised when an LLM call fails or returns unusable output."""


class ConfigurationError(Exception):
    """Raised when no API key is available for the selected provider."""


def _build_prompt(context: str, num_questions: int) -> str:
    return (
        f"You are a quiz writer. Based on the text below, write exactly {num_questions} "
        "multiple-choice questions.\n\n"
        "Rules:\n"
        "- Each question must have exactly 4 options.\n"
        "- One of the options must be the correct answer.\n"
        "- Use only information from the text.\n"
        "- Make questions clear, unambiguous, and varied in difficulty.\n\n"
        "Return JSON in this exact format (no markdown, no commentary):\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "text": "Question?",\n'
        '      "correct_answer": "The correct option",\n'
        '      "options": ["The correct option", "Wrong 1", "Wrong 2", "Wrong 3"]\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        f'Text:\n"""\n{context}\n"""'
    )


def _parse_questions(raw: str, expected: int) -> list[QuestionDict]:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ProviderError(f"LLM returned invalid JSON: {exc}") from exc

    if isinstance(data, dict):
        questions = data.get("questions") or data.get("quiz") or []
    elif isinstance(data, list):
        questions = data
    else:
        raise ProviderError("LLM did not return a recognizable structure.")

    if not isinstance(questions, list):
        raise ProviderError("LLM did not return a list of questions.")

    cleaned: list[QuestionDict] = []
    for q in questions:
        if not isinstance(q, dict):
            continue
        text = q.get("text") or q.get("question")
        correct = q.get("correct_answer") or q.get("answer") or q.get("correctAnswer")
        options = q.get("options")
        if not text or not correct or not isinstance(options, list) or len(options) < 2:
            continue
        options_str = [str(o) for o in options[:4]]
        correct_str = str(correct)
        if correct_str not in options_str:
            options_str = [correct_str, *options_str[:3]]
        while len(options_str) < 4:
            options_str.append(f"Option {len(options_str) + 1}")
        cleaned.append(
            {
                "text": str(text),
                "correct_answer": correct_str,
                "options": options_str[:4],
            }
        )

    if not cleaned:
        raise ProviderError("LLM did not return any valid questions.")

    return cleaned[:expected]


class LLMProvider(ABC):
    name: str

    @abstractmethod
    def generate_quiz(self, context: str, num_questions: int) -> list[QuestionDict]: ...


class GroqProvider(LLMProvider):
    name = "groq"
    DEFAULT_MODEL = "llama-3.3-70b-versatile"

    def __init__(self, api_key: str, model: str | None = None) -> None:
        from groq import Groq

        self.client = Groq(api_key=api_key)
        self.model = model or self.DEFAULT_MODEL

    def generate_quiz(self, context: str, num_questions: int) -> list[QuestionDict]:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": _build_prompt(context, num_questions)}],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
        except Exception as exc:
            raise ProviderError(f"Groq call failed: {exc}") from exc

        content = response.choices[0].message.content or ""
        return _parse_questions(content, num_questions)


class GeminiProvider(LLMProvider):
    name = "gemini"
    DEFAULT_MODEL = "gemini-2.0-flash"

    def __init__(self, api_key: str, model: str | None = None) -> None:
        from google import genai

        self.client = genai.Client(api_key=api_key)
        self.model = model or self.DEFAULT_MODEL

    def generate_quiz(self, context: str, num_questions: int) -> list[QuestionDict]:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=_build_prompt(context, num_questions),
                config={"response_mime_type": "application/json"},
            )
        except Exception as exc:
            raise ProviderError(f"Gemini call failed: {exc}") from exc

        text = getattr(response, "text", "") or ""
        return _parse_questions(text, num_questions)


def resolve_provider(name: str | None, user_key: str | None) -> LLMProvider:
    """Pick an LLMProvider. User-supplied key bypasses server quota."""
    selected = (name or "groq").lower()
    if selected not in {"groq", "gemini"}:
        raise ConfigurationError(f"Unknown provider '{selected}'.")

    if user_key:
        if selected == "gemini":
            return GeminiProvider(user_key)
        return GroqProvider(user_key)

    if selected == "gemini":
        key = settings.GEMINI_API_KEY
        if not key:
            raise ConfigurationError(
                "Server has no GEMINI_API_KEY configured. Provide your own key or pick Groq."
            )
        return GeminiProvider(key)

    key = settings.GROQ_API_KEY
    if not key:
        raise ConfigurationError(
            "Server has no GROQ_API_KEY configured. Provide your own key or pick Gemini."
        )
    return GroqProvider(key)
