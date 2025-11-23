import pytest
from auth_service import AuthService, ROLES


class TestAuthService:
    def test_create_user_success(self, auth_service):
        success, error = auth_service.create_user(
            "testuser", "password123", ROLES["TEACHER"]
        )

        assert success is True
        assert error is None
        assert "testuser" in auth_service.users

    def test_create_user_duplicate(self, auth_service):
        auth_service.create_user("testuser2", "password123", ROLES["TEACHER"])
        success, error = auth_service.create_user(
            "testuser2", "password123", ROLES["TEACHER"]
        )

        assert success is False
        assert "already exists" in error.lower()

    def test_authenticate_success(self, auth_service):
        auth_service.create_user("testuser3", "password123", ROLES["TEACHER"])

        success, error_msg, result = auth_service.authenticate("testuser3", "password123")

        assert success is True
        assert error_msg is None
        assert result is not None
        assert "token" in result
        assert result["user"]["username"] == "testuser3"

    def test_authenticate_invalid_credentials(self, auth_service):
        success, error_msg, result = auth_service.authenticate("nonexistent", "wrongpass")

        assert success is False
        assert "invalid" in error_msg.lower()
        assert result is None

    def test_verify_token_success(self, auth_service):
        auth_service.create_user("testuser4", "password123", ROLES["TEACHER"])
        success, result = auth_service.authenticate("testuser4", "password123")
        token = result["token"]

        is_valid, user_info = auth_service.verify_token(token)

        assert is_valid is True
        assert user_info is not None
        assert user_info["username"] == "testuser4"

    def test_verify_token_invalid(self, auth_service):
        is_valid, user_info = auth_service.verify_token("invalid_token")

        assert is_valid is False
        assert user_info is None

    def test_has_permission(self, auth_service):
        auth_service.create_user("admin_user", "password", ROLES["ADMIN"])
        success, _, result = auth_service.authenticate("admin_user", "password")
        token = result["token"]
        is_valid, user_info = auth_service.verify_token(token)

        assert auth_service.has_permission(user_info, "read") is True
        assert auth_service.has_permission(user_info, "write") is True
        assert auth_service.has_permission(user_info, "delete") is True

    def test_has_permission_teacher(self, auth_service):
        auth_service.create_user("teacher_user", "password", ROLES["TEACHER"])
        success, _, result = auth_service.authenticate("teacher_user", "password")
        token = result["token"]
        is_valid, user_info = auth_service.verify_token(token)

        assert auth_service.has_permission(user_info, "read") is True
        assert auth_service.has_permission(user_info, "write") is True
        assert auth_service.has_permission(user_info, "delete") is False

