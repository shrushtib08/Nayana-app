from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model. Email is the login identifier; username is kept
    for Django admin compatibility but not used for authentication.
    """

    LANGUAGE_CHOICES = [
        ("en", "English"),
        ("kn", "Kannada"),
        ("hi", "Hindi"),
        ("te", "Telugu"),
        ("ta", "Tamil"),
        ("ml", "Malayalam"),
        ("mr", "Marathi"),
        ("bn", "Bengali"),
        ("es", "Spanish"),
        ("ko", "Korean"),
    ]

    ACCESSIBILITY_CHOICES = [
        ("standard", "Standard"),
        ("elderly", "Easy Mode (Elderly)"),
        ("visually_impaired", "Visually Impaired Mode"),
    ]

    THEME_CHOICES = [
        ("light", "Light"),
        ("dark", "Dark"),
        ("high_contrast", "High Contrast"),
    ]

    email = models.EmailField(unique=True)
    preferred_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    accessibility_mode = models.CharField(max_length=20, choices=ACCESSIBILITY_CHOICES, default="standard")
    theme_preference = models.CharField(max_length=20, choices=THEME_CHOICES, default="light")
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self) -> str:
        return self.email
