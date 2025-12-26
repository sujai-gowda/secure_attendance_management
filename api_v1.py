from flask import Blueprint, request, jsonify, g, current_app
from typing import Dict, Any, Optional
import logging
from functools import wraps
from marshmallow import ValidationError
from datetime import datetime

from blockchain_service import BlockchainService
from auth_service import auth_service
from api_schemas import (
    create_error_response,
    create_success_response,
    create_paginated_response,
    LoginRequestSchema,
    LoginResponseSchema,
    StatsResponseSchema,
    RecordsResponseSchema,
    ExportRequestSchema,
    ExportResponseSchema,
    PaginationSchema,
    AttendanceSubmissionRequestSchema,
    AttendanceSubmissionResponseSchema,
    CreateClassroomRequestSchema,
    AddStudentsRequestSchema,
    ClassroomResponseSchema,
)
from validators import validate_attendance_form

logger = logging.getLogger(__name__)

api_v1 = Blueprint('api_v1', __name__, url_prefix='/api/v1')

_limiter_instance = None

def set_limiter(app_limiter):
    """Set the limiter instance for this module"""
    global _limiter_instance
    _limiter_instance = app_limiter

def get_limiter():
    """Get limiter from module variable"""
    return _limiter_instance

class LimiterProxy:
    """Proxy for limiter that works with blueprints"""
    def limit(self, *args, **kwargs):
        def decorator(f):
            # Get the actual limiter instance at decoration time
            limiter_obj = _limiter_instance
            if limiter_obj and hasattr(limiter_obj, 'limit'):
                # Apply Flask-Limiter's decorator directly
                # Flask-Limiter's limit() returns a decorator that wraps the function
                return limiter_obj.limit(*args, **kwargs)(f)
            # If limiter is not available, return function as-is
            return f
        return decorator

limiter = LimiterProxy()


@api_v1.route('/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    try:
        schema = LoginRequestSchema()
        data = schema.load(request.get_json() or {})
        
        username = data.get('username')
        password = data.get('password')
        
        success, error_msg, result = auth_service.authenticate(username, password)
        
        if not success:
            return jsonify(create_error_response(
                "authentication_failed",
                error_msg,
                401
            )), 401
        
        response_data = {
            "token": result["token"],
            "user": result["user"],
            "expires_in": 86400
        }
        
        return jsonify(create_success_response(response_data)), 200
        
    except ValidationError as err:
        return jsonify(create_error_response(
            "validation_error",
            "Invalid request data",
            400,
            err.messages
        )), 400
    except Exception as e:
        logger.error(f"Error in login: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "An error occurred during login",
            500
        )), 500


@api_v1.route('/auth/verify', methods=['GET'])
def verify():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify(create_error_response(
                "unauthorized",
                "Authorization header missing",
                401
            )), 401

        token = auth_header.split(" ")[1] if " " in auth_header else None
        if not token:
            return jsonify(create_error_response(
                "unauthorized",
                "Invalid authorization header",
                401
            )), 401

        is_valid, user_info = auth_service.verify_token(token)
        if not is_valid:
            return jsonify(create_error_response(
                "unauthorized",
                "Invalid or expired token",
                401
            )), 401

        return jsonify(create_success_response(user_info)), 200
        
    except Exception as e:
        logger.error(f"Error in verify: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "An error occurred during verification",
            500
        )), 500


@api_v1.route('/auth/refresh', methods=['POST'])
@limiter.limit("10 per minute")
def refresh_token():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify(create_error_response(
                "unauthorized",
                "Authorization header missing",
                401
            )), 401

        token = auth_header.split(" ")[1] if " " in auth_header else None
        if not token:
            return jsonify(create_error_response(
                "unauthorized",
                "Invalid authorization header",
                401
            )), 401

        success, error_msg, result = auth_service.refresh_token(token)
        if not success:
            return jsonify(create_error_response(
                "token_refresh_failed",
                error_msg or "Failed to refresh token",
                401
            )), 401

        return jsonify(create_success_response(result)), 200
        
    except Exception as e:
        logger.error(f"Error in refresh_token: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "An error occurred during token refresh",
            500
        )), 500


@api_v1.route('/stats', methods=['GET'])
@limiter.limit("30 per minute")
def get_stats():
    try:
        blockchain_service: BlockchainService = g.blockchain_service
        stats = blockchain_service.get_stats()
        
        schema = StatsResponseSchema()
        validated_stats = schema.load(stats)
        
        return jsonify(create_success_response(validated_stats)), 200
        
    except Exception as e:
        logger.error(f"Error in get_stats: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to retrieve statistics",
            500
        )), 500


@api_v1.route('/records', methods=['GET'])
@limiter.limit("30 per minute")
def get_records():
    try:
        blockchain_service: BlockchainService = g.blockchain_service
        
        teacher_name = request.args.get('teacher_name', '').strip()
        course = request.args.get('course', '').strip()
        date = request.args.get('date', '').strip()
        year = request.args.get('year', '').strip()
        
        all_records = blockchain_service.get_all_records()
        
        if teacher_name or course or date or year:
            filtered_records = []
            for record in all_records:
                match = True
                if teacher_name:
                    record_teacher = str(record.get('teacher_name', '')).strip()
                    if record_teacher != teacher_name:
                        match = False
                if course:
                    record_course = str(record.get('course', '')).strip()
                    if record_course != course:
                        match = False
                if date:
                    record_date = str(record.get('date', '')).strip()
                    if record_date != date:
                        match = False
                if year:
                    record_year = str(record.get('year', '')).strip()
                    if record_year != year:
                        match = False
                if match:
                    filtered_records.append(record)
            all_records = filtered_records
        
        pagination_schema = PaginationSchema()
        pagination = pagination_schema.load({
            'page': request.args.get('page', 1, type=int),
            'per_page': request.args.get('per_page', 10, type=int)
        })
        
        page = pagination['page']
        per_page = pagination['per_page']
        total = len(all_records)
        
        start = (page - 1) * per_page
        end = start + per_page
        paginated_records = all_records[start:end]
        
        response_data = create_paginated_response(
            paginated_records,
            page,
            per_page,
            total
        )
        
        return jsonify(create_success_response(response_data)), 200
        
    except ValidationError as err:
        return jsonify(create_error_response(
            "validation_error",
            "Invalid pagination parameters",
            400,
            err.messages
        )), 400
    except Exception as e:
        logger.error(f"Error in get_records: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to retrieve records",
            500
        )), 500


@api_v1.route('/analytics', methods=['GET'])
@limiter.limit("20 per minute")
def get_analytics():
    try:
        blockchain_service: BlockchainService = g.blockchain_service
        
        pagination_schema = PaginationSchema()
        pagination = pagination_schema.load({
            'page': request.args.get('page', 1, type=int),
            'per_page': request.args.get('per_page', 50, type=int)
        })
        
        analytics = blockchain_service.get_analytics()
        
        if pagination['per_page'] < 50:
            overview = analytics.get('overview', {})
            by_teacher = dict(list(analytics.get('by_teacher', {}).items())[:pagination['per_page']])
            by_course = dict(list(analytics.get('by_course', {}).items())[:pagination['per_page']])
            
            analytics = {
                **analytics,
                'overview': overview,
                'by_teacher': by_teacher,
                'by_course': by_course
            }
        
        return jsonify(create_success_response(analytics)), 200
        
    except ValidationError as err:
        return jsonify(create_error_response(
            "validation_error",
            "Invalid pagination parameters",
            400,
            err.messages
        )), 400
    except Exception as e:
        logger.error(f"Error in get_analytics: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to retrieve analytics",
            500
        )), 500


@api_v1.route('/export/<format>', methods=['GET'])
@limiter.limit("10 per minute")
@auth_service.require_auth("read")
def export_data(format: str):
    try:
        schema = ExportRequestSchema()
        schema.load({'format': format})
        
        blockchain_service: BlockchainService = g.blockchain_service
        success, message = blockchain_service.export_data(format)
        
        if not success:
            return jsonify(create_error_response(
                "export_failed",
                message,
                400
            )), 400
        
        return jsonify(create_success_response(
            {"message": message},
            "Export completed successfully"
        )), 200
        
    except ValidationError as err:
        return jsonify(create_error_response(
            "validation_error",
            "Invalid export format",
            400,
            err.messages
        )), 400
    except Exception as e:
        logger.error(f"Error in export_data: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to export data",
            500
        )), 500


@api_v1.route('/integrity', methods=['GET'])
@limiter.limit("30 per minute")
def check_integrity():
    try:
        blockchain_service: BlockchainService = g.blockchain_service
        integrity_result = blockchain_service.check_chain_integrity()
        
        is_valid = "verified" in integrity_result.lower() or "valid" in integrity_result.lower()
        
        response_data = {
            "result": integrity_result,
            "is_valid": is_valid,
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(create_success_response(response_data)), 200
        
    except Exception as e:
        logger.error(f"Error in check_integrity: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to check blockchain integrity",
            500
        )), 500


@api_v1.route('/students/<roll_no>', methods=['GET'])
@limiter.limit("30 per minute")
def search_student(roll_no: str):
    try:
        if not roll_no or not roll_no.strip():
            return jsonify(create_error_response(
                "validation_error",
                "Roll number is required",
                400
            )), 400
        
        blockchain_service: BlockchainService = g.blockchain_service
        records = blockchain_service.search_by_student(roll_no.strip())
        
        response_data = {
            "roll_no": roll_no.strip(),
            "records": records,
            "total_records": len(records)
        }
        
        return jsonify(create_success_response(response_data)), 200
        
    except Exception as e:
        logger.error(f"Error in search_student: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to search student records",
            500
        )), 500


@api_v1.route('/report', methods=['GET'])
@limiter.limit("20 per minute")
@auth_service.require_auth("read")
def get_report():
    try:
        format_type = request.args.get('format', 'json')
        
        if format_type not in ['text', 'json']:
            return jsonify(create_error_response(
                "validation_error",
                "Format must be 'text' or 'json'",
                400
            )), 400
        
        blockchain_service: BlockchainService = g.blockchain_service
        report = blockchain_service.generate_report(format_type)
        
        if format_type == 'text':
            return report, 200, {'Content-Type': 'text/plain'}
        else:
            return jsonify(create_success_response({"report": report})), 200
        
    except Exception as e:
        logger.error(f"Error in get_report: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to generate report",
            500
        )), 500


@api_v1.route('/attendance', methods=['POST'])
@limiter.limit("10 per minute")
def submit_attendance():
    try:
        schema = AttendanceSubmissionRequestSchema()
        data = schema.load(request.get_json() or {})
        
        blockchain_service: BlockchainService = g.blockchain_service
        classroom_service = getattr(g, 'classroom_service', None)
        
        if classroom_service is None:
            return jsonify(create_error_response(
                "service_unavailable",
                "Classroom service is not available",
                503
            )), 503
        
        class_id = data["class_id"].strip()
        classroom = classroom_service.get_classroom(class_id)
        
        if not classroom:
            return jsonify(create_error_response(
                "not_found",
                f"Classroom {class_id} not found",
                404
            )), 404
        
        attendance_data = {
            "teacher_name": data["teacher_name"],
            "date": data["date"].strftime("%Y-%m-%d"),
            "course": data["course"],
            "year": data["year"],
            "class_id": classroom.id,
            "class_name": classroom.name,
            "present_students": data["present_students"],
        }
        
        is_valid, validated_data, error_msg = validate_attendance_form(attendance_data)
        
        if not is_valid:
            return jsonify(create_error_response(
                "validation_error",
                error_msg,
                400
            )), 400
        
        roster_rolls = {
            student.roll_number.strip().lower()
            for student in classroom.students
            if student.roll_number
        }
        invalid_rolls = [
            roll for roll in validated_data["present_students"]
            if roll.strip().lower() not in roster_rolls
        ]
        
        if invalid_rolls:
            return jsonify(create_error_response(
                "validation_error",
                f"Roll number(s) {', '.join(invalid_rolls)} are not part of classroom {classroom.name}",
                400
            )), 400
        
        attendance_payload = {
            "teacher_name": validated_data["teacher_name"],
            "date": validated_data["date"].strftime("%Y-%m-%d"),
            "course": validated_data["course"],
            "year": validated_data["year"],
            "class_id": classroom.id,
            "class_name": classroom.name,
        }
        
        form_dict_with_rolls = {f"roll_no{i+1}": roll for i, roll in enumerate(validated_data["present_students"])}
        form_dict_with_rolls.update({
            "teacher_name": validated_data["teacher_name"],
            "date": validated_data["date"].strftime("%Y-%m-%d"),
            "course": validated_data["course"],
            "year": validated_data["year"],
            "class_id": classroom.id,
            "class_name": classroom.name,
        })
        
        success, result = blockchain_service.add_attendance_block(
            form_dict_with_rolls, attendance_payload
        )
        
        if not success:
            return jsonify(create_error_response(
                "submission_failed",
                result,
                400
            )), 400
        
        block_index_match = None
        if "Block #" in result:
            import re
            match = re.search(r'Block #(\d+)', result)
            if match:
                block_index_match = int(match.group(1))
        
        students_count = len(validated_data["present_students"])
        
        response_data = {
            "message": result,
            "block_index": block_index_match,
            "students_count": students_count,
            "class_id": classroom.id,
        }
        
        return jsonify(create_success_response(
            response_data,
            "Attendance recorded successfully"
        )), 200
        
    except ValidationError as err:
        return jsonify(create_error_response(
            "validation_error",
            "Invalid request data",
            400,
            err.messages
        )), 400
    except Exception as e:
        logger.error(f"Error in submit_attendance: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to submit attendance",
            500
        )), 500


@api_v1.route('/classrooms', methods=['POST'])
@limiter.limit("10 per minute")
def create_classroom():
    """Create a new classroom"""
    try:
        schema = CreateClassroomRequestSchema()
        data = schema.load(request.get_json() or {})
        
        classroom_service: ClassroomService = g.classroom_service
        
        classroom = classroom_service.create_classroom(
            name=data['name'],
            expected_student_count=data['expected_student_count'],
            description=data.get('description', '')
        )
        
        response_data = classroom.to_dict()
        response_data['current_student_count'] = len(classroom.students)
        
        return jsonify(create_success_response(
            response_data,
            "Classroom created successfully"
        )), 201
        
    except ValidationError as err:
        return jsonify(create_error_response(
            "validation_error",
            "Invalid request data",
            400,
            err.messages
        )), 400
    except ValueError as e:
        return jsonify(create_error_response(
            "validation_error",
            str(e),
            400
        )), 400
    except Exception as e:
        logger.error(f"Error in create_classroom: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to create classroom",
            500
        )), 500


@api_v1.route('/classrooms', methods=['GET'])
@limiter.limit("30 per minute")
def list_classrooms():
    """List all classrooms"""
    try:
        classroom_service: ClassroomService = g.classroom_service
        
        classrooms = classroom_service.list_classrooms()
        
        response_data = []
        for classroom in classrooms:
            classroom_dict = classroom.to_dict()
            classroom_dict['current_student_count'] = len(classroom.students)
            response_data.append(classroom_dict)
        
        return jsonify(create_success_response(response_data)), 200
        
    except Exception as e:
        logger.error(f"Error in list_classrooms: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to retrieve classrooms",
            500
        )), 500


@api_v1.route('/classrooms/<class_id>', methods=['GET'])
@limiter.limit("30 per minute")
def get_classroom(class_id: str):
    """Get classroom details including roster"""
    try:
        if not class_id or not class_id.strip():
            return jsonify(create_error_response(
                "validation_error",
                "Classroom ID is required",
                400
            )), 400
        
        classroom_service: ClassroomService = g.classroom_service
        classroom = classroom_service.get_classroom(class_id.strip())
        
        if not classroom:
            return jsonify(create_error_response(
                "not_found",
                f"Classroom {class_id} not found",
                404
            )), 404
        
        response_data = classroom.to_dict()
        response_data['current_student_count'] = len(classroom.students)
        
        return jsonify(create_success_response(response_data)), 200
        
    except Exception as e:
        logger.error(f"Error in get_classroom: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to retrieve classroom",
            500
        )), 500


@api_v1.route('/classrooms/<class_id>', methods=['DELETE'])
@limiter.limit("10 per minute")
def delete_classroom(class_id: str):
    """Delete a classroom"""
    try:
        if not class_id or not class_id.strip():
            return jsonify(create_error_response(
                "validation_error",
                "Classroom ID is required",
                400
            )), 400
        
        classroom_service: ClassroomService = g.classroom_service
        
        success = classroom_service.delete_classroom(class_id.strip())
        
        if not success:
            return jsonify(create_error_response(
                "not_found",
                f"Classroom {class_id} not found",
                404
            )), 404
        
        return jsonify(create_success_response(
            {"id": class_id},
            "Classroom deleted successfully"
        )), 200
        
    except Exception as e:
        logger.error(f"Error in delete_classroom: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to delete classroom",
            500
        )), 500


@api_v1.route('/classrooms/<class_id>/students', methods=['POST'])
@limiter.limit("10 per minute")
def add_students_to_classroom(class_id: str):
    """Register students for a class"""
    try:
        if not class_id or not class_id.strip():
            return jsonify(create_error_response(
                "validation_error",
                "Classroom ID is required",
                400
            )), 400
        
        schema = AddStudentsRequestSchema()
        data = schema.load(request.get_json() or {})
        
        classroom_service: ClassroomService = g.classroom_service
        
        # Check if classroom exists
        classroom = classroom_service.get_classroom(class_id.strip())
        if not classroom:
            return jsonify(create_error_response(
                "not_found",
                f"Classroom {class_id} not found",
                404
            )), 404
        
        # Validate max student count
        new_students_count = len(data['students'])
        current_student_count = len(classroom.students)
        total_after_add = current_student_count + new_students_count
        
        if classroom.expected_student_count > 0 and total_after_add > classroom.expected_student_count:
            return jsonify(create_error_response(
                "validation_error",
                f"Cannot add {new_students_count} students. "
                f"Classroom has {current_student_count} students and maximum is {classroom.expected_student_count}. "
                f"Only {classroom.expected_student_count - current_student_count} more students can be added.",
                400
            )), 400
        
        # Add students
        updated_classroom = classroom_service.add_students_to_class(
            class_id.strip(),
            data['students']
        )
        
        response_data = updated_classroom.to_dict()
        response_data['current_student_count'] = len(updated_classroom.students)
        
        return jsonify(create_success_response(
            response_data,
            f"Successfully added {new_students_count} student(s) to classroom"
        )), 200
        
    except ValidationError as err:
        return jsonify(create_error_response(
            "validation_error",
            "Invalid request data",
            400,
            err.messages
        )), 400
    except ValueError as e:
        return jsonify(create_error_response(
            "validation_error",
            str(e),
            400
        )), 400
    except Exception as e:
        logger.error(f"Error in add_students_to_classroom: {str(e)}", exc_info=True)
        return jsonify(create_error_response(
            "internal_error",
            "Failed to add students to classroom",
            500
        )), 500


@api_v1.before_request
def inject_services():
    from blockchain import blockchain_service
    from classroom_service import ClassroomService
    g.blockchain_service = blockchain_service
    if not hasattr(g, 'classroom_service'):
        g.classroom_service = ClassroomService(seed=True)

