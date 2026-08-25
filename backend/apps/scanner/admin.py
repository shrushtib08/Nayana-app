from django.contrib import admin

from .models import DocumentQuestion, ErrorLog, Feedback, Scan


@admin.register(Scan)
class ScanAdmin(admin.ModelAdmin):
    # Deliberately exclude ocr_text/analysis body content from the list view —
    # admins can open a record if needed, but private document contents
    # shouldn't be casually browsable in a table.
    list_display = ["id", "category", "language", "confidence", "created_at", "user"]
    list_filter = ["category", "language"]
    search_fields = ["id"]
    readonly_fields = ["id", "created_at"]


@admin.register(DocumentQuestion)
class DocumentQuestionAdmin(admin.ModelAdmin):
    list_display = ["scan", "found_in_document", "created_at"]


@admin.register(ErrorLog)
class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ["scope", "created_at", "user"]
    list_filter = ["scope"]
    readonly_fields = ["scope", "message", "user", "created_at"]


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ["scan", "was_helpful", "created_at"]
