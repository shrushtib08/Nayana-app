from django.urls import path

from . import views

urlpatterns = [
    path("analyze/", views.AnalyzeView.as_view(), name="analyze"),
    path("history/", views.HistoryListView.as_view(), name="history-list"),
    path("history/<uuid:id>/", views.HistoryDetailView.as_view(), name="history-detail"),
    path("ask-document/", views.AskDocumentView.as_view(), name="ask-document"),
    path("feedback/", views.FeedbackView.as_view(), name="feedback"),
]
