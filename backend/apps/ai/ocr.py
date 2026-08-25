"""
OCRService: abstraction over text-extraction providers so medicine labels,
government forms, contracts, bills, signs, and textbook pages can all be
read the same way regardless of which OCR backend is configured.
"""

from __future__ import annotations

import logging

from django.conf import settings

logger = logging.getLogger(__name__)


class BaseOCRProvider:
    def extract_text(self, image_bytes: bytes) -> str:
        raise NotImplementedError


class GoogleVisionOCRProvider(BaseOCRProvider):
    def __init__(self):
        from google.cloud import vision

        self.client = vision.ImageAnnotatorClient()
        self._vision = vision

    def extract_text(self, image_bytes: bytes) -> str:
        image = self._vision.Image(content=image_bytes)
        response = self.client.text_detection(image=image)
        if response.error.message:
            raise RuntimeError(response.error.message)
        annotations = response.text_annotations
        return annotations[0].description if annotations else ""


class TesseractOCRProvider(BaseOCRProvider):
    def __init__(self):
        import pytesseract  # noqa: F401 - import check only

    def extract_text(self, image_bytes: bytes) -> str:
        import io

        import pytesseract
        from PIL import Image

        image = Image.open(io.BytesIO(image_bytes))
        # Tesseract language packs: eng, kan, hin, tel, tam, mal must be installed
        # on the host system for non-English text; falls back to English.
        return pytesseract.image_to_string(image)


class DemoOCRProvider(BaseOCRProvider):
    """Returns empty text; the AIService's demo provider does not require OCR input."""

    def extract_text(self, image_bytes: bytes) -> str:
        return ""


def _select_ocr_provider() -> BaseOCRProvider:
    provider_name = getattr(settings, "OCR_PROVIDER", "demo")
    try:
        if provider_name == "google_vision" and settings.GOOGLE_VISION_API_KEY:
            return GoogleVisionOCRProvider()
        if provider_name == "tesseract":
            return TesseractOCRProvider()
    except Exception:  # noqa: BLE001
        logger.exception("Failed to initialize OCR provider %s; falling back to demo", provider_name)
    return DemoOCRProvider()


class OCRService:
    def __init__(self, provider: BaseOCRProvider | None = None):
        self.provider = provider or _select_ocr_provider()

    def extract_text(self, image_bytes: bytes) -> str:
        try:
            return self.provider.extract_text(image_bytes)
        except Exception:  # noqa: BLE001
            logger.exception("OCR extraction failed; returning empty text")
            return ""
