import uuid

from django.conf import settings
from django.db import models


class Scan(models.Model):
    """
    One scanned image and its structured analysis. Stores the AI's response
    (title, summary, warnings, etc.) as JSON so the frontend contract can
    evolve without a migration each time, while OCR text and the image are
    kept separately for the "Ask This Document" feature and history thumbnails.
    """

    CATEGORY_CHOICES = [
        ("medicine", "Medicine"),
        ("government", "Government"),
        ("legal", "Legal"),
        ("transport", "Transport"),
        ("education", "Education"),
        ("food", "Food"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scans", null=True, blank=True
    )
    image = models.ImageField(upload_to="scans/%Y/%m/", null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    language = models.CharField(max_length=5, default="en")
    ocr_text = models.TextField(blank=True)
    analysis = models.JSONField(default=dict)  # full structured AnalysisResult payload
    confidence = models.FloatField(default=0.5)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        title = self.analysis.get("title", "Untitled")
        return f"{title} ({self.category})"


class DocumentQuestion(models.Model):
    """A single Q&A turn from the 'Ask This Document' feature, kept for history/audit."""

    scan = models.ForeignKey(Scan, on_delete=models.CASCADE, related_name="questions")
    question = models.TextField()
    answer = models.TextField()
    found_in_document = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class ErrorLog(models.Model):
    """Lightweight error log surfaced in Django admin for debugging AI/OCR failures."""

    scope = models.CharField(max_length=50)  # e.g. "ai_analysis", "ocr", "translation"
    message = models.TextField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="error_logs", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Feedback(models.Model):
    """User feedback on a scan result (e.g. thumbs up/down, free text)."""

    scan = models.ForeignKey(Scan, on_delete=models.CASCADE, related_name="feedback")
    was_helpful = models.BooleanField(null=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
