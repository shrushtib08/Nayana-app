from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.scanner.models import Scan

from .services import SUPPORTED_LANGUAGES, TranslationService


class TranslateRequestSerializer(serializers.Serializer):
    text = serializers.CharField(required=False, allow_blank=True)
    scan_id = serializers.UUIDField(required=False)
    target_language = serializers.ChoiceField(choices=list(SUPPORTED_LANGUAGES.keys()))


class TranslateView(APIView):
    """
    POST /api/translate/
    Body: either { "text": "...", "target_language": "kn" }
          or      { "scan_id": "...", "target_language": "kn" } to re-translate
                  a saved scan's simple_explanation in place.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TranslateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        target_language = data["target_language"]
        service = TranslationService()

        if "scan_id" in data:
            try:
                scan = Scan.objects.get(id=data["scan_id"])
            except Scan.DoesNotExist:
                return Response({"detail": "Scan not found."}, status=status.HTTP_404_NOT_FOUND)
            translated = service.translate(scan.analysis.get("simple_explanation", ""), target_language)
            return Response({"translatedText": translated, "language": target_language})

        text = data.get("text", "")
        if not text:
            return Response({"detail": "Provide either 'text' or 'scan_id'."}, status=status.HTTP_400_BAD_REQUEST)
        translated = service.translate(text, target_language)
        return Response({"translatedText": translated, "language": target_language})


class SpeechView(APIView):
    """
    POST /api/speech/
    The primary text-to-speech path runs client-side via the Web Speech API
    (see frontend/src/services/speechService.ts) so it works offline and
    needs no server round-trip. This endpoint exists for the documented API
    contract and for future server-side TTS (e.g. higher-quality regional
    voices); it currently returns the text back with the resolved locale tag
    so a future audio-generating provider can be dropped in here.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get("text", "")
        language = request.data.get("language", "en")
        if not text:
            return Response({"detail": "Text is required."}, status=status.HTTP_400_BAD_REQUEST)
        locale_map = {
            "en": "en-IN",
            "kn": "kn-IN",
            "hi": "hi-IN",
            "te": "te-IN",
            "ta": "ta-IN",
            "ml": "ml-IN",
            "mr": "mr-IN",
            "bn": "bn-IN",
            "es": "es-ES",
            "ko": "ko-KR",
        }
        return Response(
            {
                "text": text,
                "locale": locale_map.get(language, "en-IN"),
                "provider": "web_speech_client_side",
                "detail": "Use the browser's built-in speech synthesis with this locale tag.",
            }
        )
