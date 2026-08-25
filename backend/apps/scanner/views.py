import base64
import logging

from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveDestroyAPIView
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai.ocr import OCRService
from apps.ai.services import AIService

from .models import DocumentQuestion, ErrorLog, Feedback, Scan
from .serializers import (
    AnalyzeRequestSerializer,
    AskDocumentRequestSerializer,
    ScanListSerializer,
    ScanSerializer,
)

logger = logging.getLogger(__name__)


def _decode_data_url(data_url: str) -> bytes:
    """Accepts either a raw data URL (data:image/jpeg;base64,...) or plain base64."""
    if "," in data_url and data_url.startswith("data:"):
        data_url = data_url.split(",", 1)[1]
    return base64.b64decode(data_url)


class AnalyzeView(APIView):
    """
    POST /api/analyze/
    Body: { "image": "data:image/jpeg;base64,...", "language": "en" }

    Runs the full pipeline: OCR -> AIService.analyze -> persist Scan -> return
    the structured AnalysisResult the frontend renders on the Result screen.
    This is intentionally the ONLY view that touches the AI pipeline directly —
    see apps/ai/services.py for the actual stage-by-stage logic.
    """

    permission_classes = [AllowAny]  # scanning works without an account (see README)
    parser_classes = [JSONParser, MultiPartParser]

    def post(self, request):
        serializer = AnalyzeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image_data_url = serializer.validated_data["image"]
        language = serializer.validated_data["language"]

        try:
            image_bytes = _decode_data_url(image_data_url)
        except Exception:
            return Response(
                {"detail": "That image could not be read. Please try capturing it again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_bytes = 10 * 1024 * 1024
        if len(image_bytes) > max_bytes:
            return Response(
                {"detail": "That image is too large. Please try a smaller photo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ocr_text = OCRService().extract_text(image_bytes)
            result = AIService().analyze(image_bytes=image_bytes, ocr_text=ocr_text, language=language)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Analysis pipeline failed")
            ErrorLog.objects.create(
                scope="ai_analysis",
                message=str(exc),
                user=request.user if request.user.is_authenticated else None,
            )
            return Response(
                {"detail": "Something went wrong while understanding this image. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        scan = Scan.objects.create(
            id=result.id,
            user=request.user if request.user.is_authenticated else None,
            category=result.category,
            language=language,
            ocr_text=ocr_text,
            analysis=result.to_dict(),
            confidence=result.confidence,
        )
        scan.image.save(f"{scan.id}.jpg", ContentFile(image_bytes), save=True)

        # Return camelCase-friendly keys matching the frontend's AnalysisResult type.
        payload = result.to_dict()
        payload["confidenceLevel"] = payload.pop("confidence_level")
        payload["simpleExplanation"] = payload.pop("simple_explanation")
        payload["importantDates"] = payload.pop("important_dates")
        payload["sourceInformation"] = payload.pop("source_information")
        payload["createdAt"] = payload.pop("created_at")
        payload["isDemo"] = payload.pop("is_demo")
        payload["imageDataUrl"] = image_data_url
        return Response(payload, status=status.HTTP_201_CREATED)


class HistoryListView(ListAPIView):
    """GET /api/history/ — most recent scans first, optionally filtered by ?search="""

    serializer_class = ScanListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Scan.objects.all()
        if self.request.user.is_authenticated:
            qs = qs.filter(user=self.request.user)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(analysis__title__icontains=search)
        return qs


class HistoryDetailView(RetrieveDestroyAPIView):
    """GET /api/history/:id/ and DELETE /api/history/:id/"""

    serializer_class = ScanSerializer
    permission_classes = [AllowAny]
    queryset = Scan.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "id"


class AskDocumentView(APIView):
    """
    POST /api/ask-document/
    Body: { "scan_id": "...", "question": "Do I need to sign this?" }

    Answers conversationally using the scan's OCR text as grounding context,
    per the "Ask The Document" feature. Always states plainly when an answer
    isn't clearly supported by the document rather than guessing.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AskDocumentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scan_id = serializer.validated_data["scan_id"]
        question = serializer.validated_data["question"]

        try:
            scan = Scan.objects.get(id=scan_id)
        except Scan.DoesNotExist:
            return Response({"detail": "Scan not found."}, status=status.HTTP_404_NOT_FOUND)

        context = scan.ocr_text or scan.analysis.get("simple_explanation", "")
        answer = AIService().ask_document(document_context=context, question=question, language=scan.language)

        DocumentQuestion.objects.create(
            scan=scan,
            question=question,
            answer=answer["answer"],
            found_in_document=answer["found_in_document"],
        )
        return Response(
            {
                "question": question,
                "answer": answer["answer"],
                "foundInDocument": answer["found_in_document"],
            }
        )


class FeedbackView(APIView):
    """POST /api/feedback/ — thumbs up/down plus optional comment on a scan result."""

    permission_classes = [AllowAny]

    def post(self, request):
        scan_id = request.data.get("scan_id")
        try:
            scan = Scan.objects.get(id=scan_id)
        except (Scan.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Scan not found."}, status=status.HTTP_404_NOT_FOUND)

        Feedback.objects.create(
            scan=scan,
            was_helpful=request.data.get("was_helpful"),
            comment=request.data.get("comment", ""),
        )
        return Response({"detail": "Thank you for your feedback."}, status=status.HTTP_201_CREATED)
