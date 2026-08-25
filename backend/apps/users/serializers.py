from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "email", "username", "password", "preferred_language"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Fall back to the email prefix for username so callers don't need
        # to supply one explicitly — keeps the signup form to just email+password.
        validated_data.setdefault("username", validated_data["email"].split("@")[0])
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "preferred_language",
            "accessibility_mode",
            "theme_preference",
            "created_at",
        ]
        read_only_fields = ["id", "email", "created_at"]
