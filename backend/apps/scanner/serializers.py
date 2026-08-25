from rest_framework import serializers

from .models import DocumentQuestion, Scan


class AnalysisResultSerializer(serializers.Serializer):
    """
    Serializes apps.ai.services.AnalysisResult (a dataclass) into the exact
    camelCase-free JSON contract the frontend's AnalysisResult type expects.
    Field names are snake_case here; the frontend's fetch layer maps them —
    see frontend/src/services/aiService.ts.
    """

    id = serializers.CharField()
    category = serializers.CharField()
    title = serializers.CharField()
    summary = serializers.CharField()
    simple_explanation = serializers.CharField()
    instructions = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    important_dates = serializers.ListField()
    money = serializers.ListField()
    risks = serializers.ListField()
    highlights = serializers.ListField()
    confidence = serializers.FloatField()
    confidence_level = serializers.CharField()
    source_information = serializers.ListField(child=serializers.CharField())
    disclaimer = serializers.CharField()
    language = serializers.CharField()
    created_at = serializers.CharField()


class ScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scan
        fields = ["id", "category", "language", "analysis", "confidence", "created_at", "image"]
        read_only_fields = fields


class ScanListSerializer(serializers.ModelSerializer):
    """Lighter-weight serializer for the history list view."""

    title = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()

    class Meta:
        model = Scan
        fields = ["id", "category", "language", "title", "summary", "created_at", "image"]

    def get_title(self, obj):
        return obj.analysis.get("title", "Untitled Scan")

    def get_summary(self, obj):
        return obj.analysis.get("summary", "")


class DocumentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentQuestion
        fields = ["id", "question", "answer", "found_in_document", "created_at"]
        read_only_fields = fields


class AnalyzeRequestSerializer(serializers.Serializer):
    """POST /api/analyze/ payload — accepts a base64 data URL from the camera capture."""

    image = serializers.CharField()  # data:image/jpeg;base64,...
    language = serializers.ChoiceField(choices=["en", "kn", "hi", "te", "ta", "ml", "mr", "bn", "es", "ko"], default="en")


class AskDocumentRequestSerializer(serializers.Serializer):
    scan_id = serializers.UUIDField()
    question = serializers.CharField()
