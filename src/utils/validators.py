from typing import Any, Dict, List, Optional
from marshmallow import Schema, fields, validate, ValidationError, post_load
from datetime import datetime
import re


def validate_teacher_name(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError("Teacher name cannot be empty")
    if len(value.strip()) > 100:
        raise ValidationError("Teacher name must be less than 100 characters")
    if not re.match(r'^[a-zA-Z\s\.\-]+$', value.strip()):
        raise ValidationError("Teacher name contains invalid characters")


def validate_course(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError("Course name cannot be empty")
    if len(value.strip()) > 200:
        raise ValidationError("Course name must be less than 200 characters")


def validate_year(value: str) -> None:
    if not value or not value.strip():
        raise ValidationError("Year cannot be empty")
    if len(value.strip()) > 50:
        raise ValidationError("Year must be less than 50 characters")


def validate_roll_number(value: str) -> None:
    if value and value.strip():
        if len(value.strip()) > 50:
            raise ValidationError("Roll number must be less than 50 characters")
        if not re.match(r'^[a-zA-Z0-9\-\_]+$', value.strip()):
            raise ValidationError("Roll number contains invalid characters")


class TeacherNameField(fields.String):
    def __init__(self, **kwargs):
        super().__init__(validate=validate_teacher_name, **kwargs)


class CourseField(fields.String):
    def __init__(self, **kwargs):
        super().__init__(validate=validate_course, **kwargs)


class YearField(fields.String):
    def __init__(self, **kwargs):
        super().__init__(validate=validate_year, **kwargs)


class RollNumberField(fields.String):
    def __init__(self, **kwargs):
        super().__init__(validate=validate_roll_number, **kwargs)


class AttendanceFormSchema(Schema):
    teacher_name = TeacherNameField(required=True)
    date = fields.Date(required=True, format='%Y-%m-%d')
    course = CourseField(required=True)
    year = YearField(required=True)
    class_id = fields.String(required=True, validate=validate.Length(min=1, max=64))
    class_name = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    present_students = fields.List(
        RollNumberField(),
        required=True,
        validate=validate.Length(min=1, error="At least one student must be marked present")
    )

    @post_load
    def validate_date(self, data: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        date = data.get('date')
        if date:
            if date > datetime.now().date():
                raise ValidationError("Date cannot be in the future")
            if date < datetime(2020, 1, 1).date():
                raise ValidationError("Date is too far in the past")
        return data


class SearchRecordsSchema(Schema):
    name = TeacherNameField(required=True)
    course = CourseField(required=True)
    year = YearField(required=True)
    date = fields.Date(required=True, format='%Y-%m-%d')
    number = fields.Integer(
        required=True,
        validate=validate.Range(min=1, max=1000, error="Number of students must be between 1 and 1000")
    )


class AttendanceRequestSchema(Schema):
    teacher_name = TeacherNameField(required=True)
    date = fields.Date(required=True, format='%Y-%m-%d')
    course = CourseField(required=True)
    year = YearField(required=True)
    roll_numbers = fields.List(
        RollNumberField(),
        required=True,
        validate=validate.Length(min=1, max=500, error="Must have between 1 and 500 students")
    )


def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    if not isinstance(value, str):
        return ""
    sanitized = value.strip()
    sanitized = re.sub(r'[<>]', '', sanitized)
    if max_length:
        sanitized = sanitized[:max_length]
    return sanitized


def validate_attendance_form(form_data: Dict[str, Any]) -> tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    try:
        schema = AttendanceFormSchema()
        validated_data = schema.load(form_data)
        return True, validated_data, None
    except ValidationError as err:
        error_messages = []
        for field, messages in err.messages.items():
            error_messages.extend(messages)
        return False, None, "; ".join(error_messages)
    except Exception as e:
        return False, None, f"Validation error: {str(e)}"


def validate_search_form(form_data: Dict[str, Any]) -> tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    try:
        schema = SearchRecordsSchema()
        validated_data = schema.load(form_data)
        return True, validated_data, None
    except ValidationError as err:
        error_messages = []
        for field, messages in err.messages.items():
            error_messages.extend(messages)
        return False, None, "; ".join(error_messages)
    except Exception as e:
        return False, None, f"Validation error: {str(e)}"

