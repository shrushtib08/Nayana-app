import firebase_admin
from django.conf import settings
from django.contrib.auth import get_user_model
from firebase_admin import auth, credentials
from rest_framework import authentication, exceptions

User = get_user_model()

# Initialize Firebase Admin SDK once
if not firebase_admin._apps:
    # Credential will be picked up from environment variable GOOGLE_APPLICATION_CREDENTIALS
    # or initialized with default credentials if running on GCP/Firebase.
    # For Render/Local, you should point to a service account JSON file.
    cred_path = getattr(settings, "FIREBASE_SERVICE_ACCOUNT_PATH", None)
    if cred_path:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()


class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION")
        if not auth_header:
            return None

        id_token = auth_header.split(" ").pop()
        if not id_token:
            return None

        try:
            decoded_token = auth.verify_id_token(id_token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f"Invalid Firebase token: {str(e)}")

        uid = decoded_token.get("uid")
        email = decoded_token.get("email")

        if not email:
            raise exceptions.AuthenticationFailed("Firebase token missing email.")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,  # Or use uid if preferred
                "is_active": True,
            },
        )

        return (user, None)
