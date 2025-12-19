import pytest
from validators import (
    validate_attendance_form,
    validate_search_form,
    sanitize_string,
)


class TestValidators:
    def test_validate_attendance_form_success(self):
        form_data = {
            "teacher_name": "John Doe",
            "date": "2024-01-15",
            "course": "Data Structures",
            "year": "2024",
            "class_id": "CLS-1234",
            "present_students": ["001", "002", "003"]
        }

        is_valid, validated_data, error_msg = validate_attendance_form(form_data)

        assert is_valid is True
        assert validated_data is not None
        assert error_msg is None
        assert validated_data["teacher_name"] == "John Doe"
        assert len(validated_data["present_students"]) == 3

    def test_validate_attendance_form_missing_fields(self):
        form_data = {
            "teacher_name": "John Doe",
        }

        is_valid, validated_data, error_msg = validate_attendance_form(form_data)

        assert is_valid is False
        assert validated_data is None
        assert error_msg is not None

    def test_validate_attendance_form_empty_students(self):
        form_data = {
            "teacher_name": "John Doe",
            "date": "2024-01-15",
            "course": "Data Structures",
            "year": "2024",
            "class_id": "CLS-1234",
            "present_students": []
        }

        is_valid, validated_data, error_msg = validate_attendance_form(form_data)

        assert is_valid is False
        assert "at least one student" in error_msg.lower()

    def test_validate_attendance_form_future_date(self):
        from datetime import datetime, timedelta
        future_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        form_data = {
            "teacher_name": "John Doe",
            "date": future_date,
            "course": "Data Structures",
            "year": "2024",
            "class_id": "CLS-1234",
            "present_students": ["001"]
        }

        is_valid, validated_data, error_msg = validate_attendance_form(form_data)

        assert is_valid is False
        assert "future" in error_msg.lower()

    def test_validate_search_form_success(self):
        form_data = {
            "name": "John Doe",
            "date": "2024-01-15",
            "course": "Data Structures",
            "year": "2024",
            "number": "10"
        }

        is_valid, validated_data, error_msg = validate_search_form(form_data)

        assert is_valid is True
        assert validated_data is not None
        assert error_msg is None

    def test_validate_search_form_invalid_number(self):
        form_data = {
            "name": "John Doe",
            "date": "2024-01-15",
            "course": "Data Structures",
            "year": "2024",
            "number": "0"
        }

        is_valid, validated_data, error_msg = validate_search_form(form_data)

        assert is_valid is False
        assert error_msg is not None

    def test_sanitize_string(self):
        dirty = "  <script>alert('xss')</script>Test  "
        clean = sanitize_string(dirty, max_length=100)

        assert "<" not in clean
        assert ">" not in clean
        assert clean.strip() == "scriptalert('xss')/scriptTest"

    def test_sanitize_string_max_length(self):
        long_string = "a" * 200
        sanitized = sanitize_string(long_string, max_length=50)

        assert len(sanitized) == 50

    def test_validate_attendance_form_invalid_teacher_name(self):
        form_data = {
            "teacher_name": "John123!@#",
            "date": "2024-01-15",
            "course": "Data Structures",
            "year": "2024",
            "class_id": "CLS-1234",
            "present_students": ["001"]
        }

        is_valid, validated_data, error_msg = validate_attendance_form(form_data)

        assert is_valid is False
        assert "invalid characters" in error_msg.lower()

