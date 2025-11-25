from marshmallow import Schema, fields, validate, ValidationError
from typing import Optional, Dict, Any


class ErrorResponseSchema(Schema):
    error = fields.String(required=True)
    message = fields.String(required=False)
    status_code = fields.Integer(required=False)
    details = fields.Dict(required=False)


class SuccessResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.String(required=False)
    data = fields.Raw(required=False)


class PaginationSchema(Schema):
    page = fields.Integer(missing=1, validate=validate.Range(min=1))
    per_page = fields.Integer(missing=10, validate=validate.Range(min=1, max=100))
    total = fields.Integer(required=False)
    pages = fields.Integer(required=False)


class PaginatedResponseSchema(Schema):
    data = fields.List(fields.Raw(), required=True)
    pagination = fields.Nested(PaginationSchema, required=True)


class LoginRequestSchema(Schema):
    username = fields.String(required=True, validate=validate.Length(min=1, max=100))
    password = fields.String(required=True, validate=validate.Length(min=1))


class LoginResponseSchema(Schema):
    token = fields.String(required=True)
    user = fields.Dict(required=True)
    expires_in = fields.Integer(required=False)


class StatsResponseSchema(Schema):
    total_blocks = fields.Integer(required=True)
    genesis_block = fields.Dict(required=False, allow_none=True)
    latest_block = fields.Dict(required=False, allow_none=True)
    attendance_blocks = fields.Integer(required=True)
    total_attendance_records = fields.Integer(required=True)


class AttendanceRecordSchema(Schema):
    block_index = fields.Integer(required=True)
    timestamp = fields.String(required=True)
    teacher_name = fields.String(required=True)
    date = fields.String(required=True)
    course = fields.String(required=True)
    year = fields.String(required=True)
    present_students = fields.List(fields.String(), required=True)
    student_count = fields.Integer(required=True)


class RecordsResponseSchema(Schema):
    records = fields.List(fields.Nested(AttendanceRecordSchema), required=True)
    count = fields.Integer(required=True)
    pagination = fields.Nested(PaginationSchema, required=False)


class ExportRequestSchema(Schema):
    format = fields.String(
        required=True,
        validate=validate.OneOf(['csv', 'analytics', 'json'])
    )


class ExportResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.String(required=True)
    filename = fields.String(required=False)


class AttendanceSubmissionRequestSchema(Schema):
    teacher_name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    course = fields.String(required=True, validate=validate.Length(min=1, max=200))
    date = fields.Date(required=True, format='%Y-%m-%d')
    year = fields.String(required=True, validate=validate.Length(min=1, max=50))
    present_students = fields.List(
        fields.String(validate=validate.Length(min=1, max=50)),
        required=True,
        validate=validate.Length(min=1, max=500, error="Must have between 1 and 500 students")
    )


class AttendanceSubmissionResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.String(required=True)
    block_index = fields.Integer(required=False)
    students_count = fields.Integer(required=False)


class StudentRecordSchema(Schema):
    date = fields.String(required=True)
    course = fields.String(required=True)
    year = fields.String(required=True)
    teacher_name = fields.String(required=True)


class StudentSearchResponseSchema(Schema):
    roll_no = fields.String(required=True)
    records = fields.List(fields.Nested(StudentRecordSchema), required=True)
    total_records = fields.Integer(required=True)


def create_error_response(
    error: str,
    message: Optional[str] = None,
    status_code: int = 400,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    response = {
        "error": error,
        "status_code": status_code
    }
    if message:
        response["message"] = message
    if details:
        response["details"] = details
    return response


def create_success_response(
    data: Any = None,
    message: Optional[str] = None
) -> Dict[str, Any]:
    response = {"success": True}
    if message:
        response["message"] = message
    if data is not None:
        response["data"] = data
    return response


def create_paginated_response(
    data: list,
    page: int,
    per_page: int,
    total: int
) -> Dict[str, Any]:
    pages = (total + per_page - 1) // per_page if total > 0 else 0
    
    return {
        "data": data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": pages,
            "has_next": page < pages,
            "has_prev": page > 1
        }
    }

