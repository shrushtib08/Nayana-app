from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ["email", "username", "preferred_language", "accessibility_mode", "is_staff", "created_at"]
    search_fields = ["email", "username"]
    ordering = ["-created_at"]
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Nayana preferences", {"fields": ("preferred_language", "accessibility_mode", "theme_preference")}),
    )
