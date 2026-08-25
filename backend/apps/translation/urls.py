from django.urls import path

from . import views

urlpatterns = [
    path("translate/", views.TranslateView.as_view(), name="translate"),
    path("speech/", views.SpeechView.as_view(), name="speech"),
]
