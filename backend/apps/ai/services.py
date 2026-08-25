"""
AIService: a single abstraction point for "look at this image and explain it"
functionality. Swapping providers (Anthropic, OpenAI, or a local demo
provider) never requires touching any view or serializer — only this file.

Usage:
    from apps.ai.services import AIService
    result = AIService().analyze(image_bytes=..., ocr_text=..., language="en")
"""

from __future__ import annotations

import base64
import json
import logging
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

from django.conf import settings

from . import prompts
from .validators import validate_and_repair_analysis

logger = logging.getLogger(__name__)


def _parse_json_response(text: str) -> dict:
    """
    Models occasionally wrap JSON in ```json fences or add stray whitespace
    even when instructed not to. Strip that defensively rather than letting
    a formatting quirk surface as a hard failure and fall back to a
    less-accurate demo response.
    """
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    return json.loads(cleaned.strip())


@dataclass
class AnalysisResult:
    """Mirrors the frontend's AnalysisResult TypeScript type exactly."""

    id: str
    category: str
    title: str
    summary: str
    simple_explanation: str
    instructions: list
    warnings: list
    important_dates: list
    money: list
    risks: list
    highlights: list
    confidence: float
    confidence_level: str
    source_information: list
    disclaimer: str
    language: str
    created_at: str
    is_demo: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


class AIProviderError(Exception):
    """Raised when the underlying AI provider call fails."""


class BaseAIProvider:
    """Interface every concrete AI provider must implement."""

    def generate_structured_response(self, image_bytes: bytes, ocr_text: str, language: str) -> dict:
        raise NotImplementedError

    def answer_question(self, document_context: str, question: str, language: str) -> dict:
        raise NotImplementedError


class AnthropicProvider(BaseAIProvider):
    """Uses Claude's vision + JSON output for image understanding."""

    MODEL = "claude-3-5-sonnet-20240620"

    def __init__(self):
        import anthropic  # imported lazily so the package is optional until configured

        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def generate_structured_response(self, image_bytes: bytes, ocr_text: str, language: str) -> dict:
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        try:
            response = self.client.messages.create(
                model=self.MODEL,
                max_tokens=2000,
                temperature=0,  # deterministic, fact-hugging output rather than creative variation
                system=prompts.SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {"type": "base64", "media_type": "image/jpeg", "data": image_b64},
                            },
                            {"type": "text", "text": prompts.build_user_prompt(ocr_text, language)},
                        ],
                    }
                ],
            )
            text = "".join(block.text for block in response.content if block.type == "text")
            return _parse_json_response(text)
        except Exception as exc:  # noqa: BLE001 - surfaced to caller as AIProviderError
            logger.exception("Anthropic provider call failed")
            raise AIProviderError(str(exc)) from exc

    def answer_question(self, document_context: str, question: str, language: str) -> dict:
        try:
            response = self.client.messages.create(
                model=self.MODEL,
                max_tokens=500,
                system=(
                    "Answer the user's question ONLY using the document context provided. "
                    "If the answer is not clearly present, say so honestly rather than guessing. "
                    f"Reply in {language}. Respond as JSON: "
                    '{"answer": string, "found_in_document": boolean}'
                ),
                messages=[
                    {
                        "role": "user",
                        "content": f"Document context:\n{document_context}\n\nQuestion: {question}",
                    }
                ],
            )
            text = "".join(block.text for block in response.content if block.type == "text")
            return json.loads(text)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Anthropic ask-document call failed")
            raise AIProviderError(str(exc)) from exc


class OpenAIProvider(BaseAIProvider):
    """Uses GPT-4o-class vision models as an alternate provider."""

    MODEL = "gpt-4o"

    def __init__(self):
        import openai

        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    def generate_structured_response(self, image_bytes: bytes, ocr_text: str, language: str) -> dict:
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        try:
            response = self.client.chat.completions.create(
                model=self.MODEL,
                response_format={"type": "json_object"},
                temperature=0,
                messages=[
                    {"role": "system", "content": prompts.SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompts.build_user_prompt(ocr_text, language)},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                            },
                        ],
                    },
                ],
            )
            return _parse_json_response(response.choices[0].message.content)
        except Exception as exc:  # noqa: BLE001
            logger.exception("OpenAI provider call failed")
            raise AIProviderError(str(exc)) from exc

    def answer_question(self, document_context: str, question: str, language: str) -> dict:
        try:
            response = self.client.chat.completions.create(
                model=self.MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Answer ONLY using the provided document context. If unclear, say so. "
                            f"Reply in {language} as JSON: "
                            '{"answer": string, "found_in_document": boolean}'
                        ),
                    },
                    {"role": "user", "content": f"Document context:\n{document_context}\n\nQuestion: {question}"},
                ],
            )
            return json.loads(response.choices[0].message.content)
        except Exception as exc:  # noqa: BLE001
            logger.exception("OpenAI ask-document call failed")
            raise AIProviderError(str(exc)) from exc


class DemoProvider(BaseAIProvider):
    """
    No external calls. Returns a representative structured response so the
    whole pipeline (view -> service -> serializer -> frontend) can be
    exercised without any AI API key. Used when AI_PROVIDER=demo, and as an
    automatic fallback if a live provider errors out.
    """

    def generate_structured_response(self, image_bytes: bytes, ocr_text: str, language: str) -> dict:
        return {
            "category": "government",
            "title": "Sample Document (Demo Mode)",
            "summary": "This is a demo response because no AI provider is configured.",
            "simple_explanation": (
                "Demo mode is active. Configure AI_PROVIDER, ANTHROPIC_API_KEY, or OPENAI_API_KEY "
                "in your .env file to see real analysis of your photo."
            ),
            "instructions": ["Add a real AI API key to .env to enable live analysis."],
            "warnings": [],
            "important_dates": [],
            "money": [],
            "risks": [],
            "confidence": 0.5,
            "source_information": ["Demo Mode — no real OCR or AI call was made."],
            "disclaimer": "This is placeholder demo content, not a real analysis.",
        }

    def answer_question(self, document_context: str, question: str, language: str) -> dict:
        return {
            "answer": "Demo mode is active, so I can't read the real document. Configure a live AI provider to enable this.",
            "found_in_document": False,
        }


def _select_provider() -> BaseAIProvider:
    provider_name = getattr(settings, "AI_PROVIDER", "demo")
    try:
        if provider_name == "anthropic" and settings.ANTHROPIC_API_KEY:
            return AnthropicProvider()
        if provider_name == "openai" and settings.OPENAI_API_KEY:
            return OpenAIProvider()
    except Exception:  # noqa: BLE001 - missing SDK, bad key, etc.
        logger.exception("Failed to initialize configured AI provider %s; falling back to demo", provider_name)
    return DemoProvider()


class AIService:
    """
    The single entry point the rest of the app should use. Handles provider
    selection, structured-response validation, confidence bucketing, and
    graceful fallback to demo data if the live provider fails.
    """

    def __init__(self, provider: BaseAIProvider | None = None):
        self.provider = provider or _select_provider()

    def analyze(self, image_bytes: bytes, ocr_text: str, language: str = "en") -> AnalysisResult:
        used_demo = isinstance(self.provider, DemoProvider)
        try:
            raw = self.provider.generate_structured_response(image_bytes, ocr_text, language)
        except AIProviderError:
            logger.warning("Live AI provider failed, falling back to demo response")
            raw = DemoProvider().generate_structured_response(image_bytes, ocr_text, language)
            used_demo = True

        raw = validate_and_repair_analysis(raw)

        confidence = float(raw.get("confidence", 0.5))
        confidence_level = "high" if confidence >= 0.8 else "medium" if confidence >= 0.5 else "low"

        return AnalysisResult(
            id=str(uuid.uuid4()),
            category=raw["category"],
            title=raw["title"],
            summary=raw["summary"],
            simple_explanation=raw["simple_explanation"],
            instructions=raw["instructions"],
            warnings=raw["warnings"],
            important_dates=raw["important_dates"],
            money=raw["money"],
            risks=raw["risks"],
            highlights=raw.get("highlights", []),
            confidence=confidence,
            confidence_level=confidence_level,
            source_information=raw["source_information"],
            disclaimer=raw["disclaimer"],
            language=language,
            created_at=datetime.now(timezone.utc).isoformat(),
            is_demo=used_demo,
        )

    def ask_document(self, document_context: str, question: str, language: str = "en") -> dict:
        try:
            raw = self.provider.answer_question(document_context, question, language)
        except AIProviderError:
            logger.warning("Live AI provider failed for ask-document, falling back to demo response")
            raw = DemoProvider().answer_question(document_context, question, language)
        return {
            "question": question,
            "answer": raw.get("answer", "I couldn't find a clear answer to that."),
            "found_in_document": bool(raw.get("found_in_document", False)),
        }
