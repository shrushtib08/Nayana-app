"""
TranslationService: abstraction over translation providers.

Nayana intentionally does NOT do literal word-for-word translation of
complex legal/official English. The goal is meaning: re-explain the
already-simplified content in the target language. Prefer routing full
re-explanation through AIService (which writes directly in the target
language — see apps/ai/prompts.py) and reserve this service for translating
short, already-simple strings (labels, quick actions, UI microcopy) where a
literal provider is fine.
"""

from __future__ import annotations

import logging

from django.conf import settings

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = {
    "en": "English",
    "kn": "Kannada",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "ml": "Malayalam",
    "mr": "Marathi",
    "bn": "Bengali",
    "es": "Spanish",
    "ko": "Korean",
}


class BaseTranslationProvider:
    def translate(self, text: str, target_language: str) -> str:
        raise NotImplementedError


class GoogleTranslateProvider(BaseTranslationProvider):
    def __init__(self):
        from google.cloud import translate_v2 as translate

        self.client = translate.Client()

    def translate(self, text: str, target_language: str) -> str:
        result = self.client.translate(text, target_language=target_language)
        return result["translatedText"]


class AIRephraseProvider(BaseTranslationProvider):
    """Routes through AIService so translation stays meaning-first, not literal."""

    def translate(self, text: str, target_language: str) -> str:
        from apps.ai.services import AIService

        # Reuses the ask_document path as a lightweight "rewrite this simply
        # in <language>" call — same provider, same safety posture.
        service = AIService()
        response = service.ask_document(
            document_context=text,
            question=f"Rewrite the above in simple {SUPPORTED_LANGUAGES.get(target_language, target_language)}, keeping the same meaning.",
            language=target_language,
        )
        return response["answer"]


class DemoTranslationProvider(BaseTranslationProvider):
    def translate(self, text: str, target_language: str) -> str:
        label = SUPPORTED_LANGUAGES.get(target_language, target_language)
        return f"[{label} translation unavailable in demo mode] {text}"


def _select_provider() -> BaseTranslationProvider:
    provider_name = getattr(settings, "TRANSLATION_PROVIDER", "demo")
    try:
        if provider_name == "google_translate" and settings.GOOGLE_TRANSLATE_API_KEY:
            return GoogleTranslateProvider()
        if provider_name == "ai":
            return AIRephraseProvider()
    except Exception:  # noqa: BLE001
        logger.exception("Failed to initialize translation provider %s; falling back to demo", provider_name)
    return DemoTranslationProvider()


class TranslationService:
    def __init__(self, provider: BaseTranslationProvider | None = None):
        self.provider = provider or _select_provider()

    def translate(self, text: str, target_language: str) -> str:
        if target_language not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language: {target_language}")
        if target_language == "en":
            return text
        try:
            return self.provider.translate(text, target_language)
        except Exception:  # noqa: BLE001
            logger.exception("Translation failed; returning original text")
            return text
