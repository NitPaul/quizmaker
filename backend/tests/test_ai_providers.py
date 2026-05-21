"""Tests for the LLM provider abstraction.

The actual Groq/Gemini network calls are NOT exercised here — we test the
parsing logic and factory function with mocks.
"""
import json

import pytest

from apps.ai import providers


class TestParseQuestions:
    def test_parses_wrapped_questions(self):
        raw = json.dumps(
            {
                "questions": [
                    {
                        "text": "Q?",
                        "correct_answer": "A",
                        "options": ["A", "B", "C", "D"],
                    }
                ]
            }
        )
        result = providers._parse_questions(raw, 1)
        assert len(result) == 1
        assert result[0]["correct_answer"] == "A"
        assert "A" in result[0]["options"]

    def test_parses_bare_array(self):
        raw = json.dumps(
            [
                {
                    "text": "Q?",
                    "correct_answer": "A",
                    "options": ["A", "B", "C", "D"],
                }
            ]
        )
        result = providers._parse_questions(raw, 1)
        assert len(result) == 1

    def test_accepts_alternate_field_names(self):
        raw = json.dumps(
            {
                "questions": [
                    {
                        "question": "Q?",
                        "answer": "A",
                        "options": ["A", "B", "C", "D"],
                    }
                ]
            }
        )
        result = providers._parse_questions(raw, 1)
        assert result[0]["text"] == "Q?"
        assert result[0]["correct_answer"] == "A"

    def test_injects_correct_answer_into_options_if_missing(self):
        raw = json.dumps(
            {
                "questions": [
                    {
                        "text": "Q?",
                        "correct_answer": "Z",
                        "options": ["A", "B", "C", "D"],
                    }
                ]
            }
        )
        result = providers._parse_questions(raw, 1)
        assert "Z" in result[0]["options"]

    def test_raises_on_invalid_json(self):
        with pytest.raises(providers.ProviderError):
            providers._parse_questions("not json", 1)

    def test_raises_when_no_valid_questions(self):
        raw = json.dumps({"questions": []})
        with pytest.raises(providers.ProviderError):
            providers._parse_questions(raw, 1)

    def test_skips_malformed_question_objects(self):
        raw = json.dumps(
            {
                "questions": [
                    {
                        "text": "Good",
                        "correct_answer": "A",
                        "options": ["A", "B", "C", "D"],
                    },
                    {"text": "Missing fields"},
                    "not a dict",
                ]
            }
        )
        result = providers._parse_questions(raw, 5)
        assert len(result) == 1

    def test_caps_at_expected_count(self):
        raw = json.dumps(
            {
                "questions": [
                    {
                        "text": f"Q{i}?",
                        "correct_answer": "A",
                        "options": ["A", "B", "C", "D"],
                    }
                    for i in range(10)
                ]
            }
        )
        result = providers._parse_questions(raw, 3)
        assert len(result) == 3


class TestResolveProvider:
    def test_user_key_defaults_to_groq(self):
        provider = providers.resolve_provider(name=None, user_key="test-key")
        assert isinstance(provider, providers.GroqProvider)

    def test_user_key_with_gemini_name(self):
        provider = providers.resolve_provider(name="gemini", user_key="test-key")
        assert isinstance(provider, providers.GeminiProvider)

    def test_server_groq_key_used_when_no_user_key(self, settings):
        settings.GROQ_API_KEY = "server-groq"
        provider = providers.resolve_provider(name="groq", user_key=None)
        assert isinstance(provider, providers.GroqProvider)

    def test_no_server_key_raises_configuration_error(self, settings):
        settings.GROQ_API_KEY = ""
        settings.GEMINI_API_KEY = ""
        with pytest.raises(providers.ConfigurationError):
            providers.resolve_provider(name="groq", user_key=None)

    def test_unknown_provider_raises(self):
        with pytest.raises(providers.ConfigurationError):
            providers.resolve_provider(name="bogus", user_key="test-key")
