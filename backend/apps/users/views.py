from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import LoginSerializer, RegisterSerializer, UserProfileSerializer


def _tokens_for_user(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"token": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create an account. Not required to use the app."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {**UserProfileSerializer(user).data, **_tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response({**UserProfileSerializer(user).data, **_tokens_for_user(user)})


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/auth/profile/ — view or update language & accessibility prefs."""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Issues a password reset request. Wire this up to an email backend
    (e.g. django.core.mail with SendGrid/SES) in production; stubbed here
    so the endpoint contract is stable for the frontend to integrate against.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        # Always respond the same way whether or not the email exists,
        # so the endpoint can't be used to enumerate registered accounts.
        return Response({"detail": "If that email is registered, a reset link has been sent."})
