from django.contrib import admin
from django.urls import include, path

from apps.users.views import ProfileView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/profile/", ProfileView.as_view(), name="profile-alias"),
    path("api/", include("apps.scanner.urls")),
    path("api/", include("apps.translation.urls")),
]
