import datetime as dt
import logging
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
from typing import Dict, Any

from src.services.blockchain_service import BlockchainService
from src.config.config import Config
from src.utils.logger_config import setup_logging
from src.utils.validators import validate_attendance_form, validate_search_form, sanitize_string
from src.services.auth_service import auth_service
from src.utils.rate_limiter import init_rate_limiter
from src.api.v1.routes import api_v1

setup_logging(Config.LOG_FILE)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = Config.SECRET_KEY

if Config.ENABLE_CSRF:
    from flask_wtf.csrf import CSRFProtect
    csrf = CSRFProtect(app)
    logger.info("CSRF protection enabled")
else:
    logger.info("CSRF protection disabled (API-first mode)")

CORS(app, resources={
    r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]},
    r"/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}
})

limiter = init_rate_limiter(app)

is_valid, error_msg = Config.validate()
if not is_valid:
    if error_msg:
        logger.warning(f"Configuration validation failed: {error_msg}")
    else:
        logger.warning(
            "SECRET_KEY is using default value. Please set a secure SECRET_KEY in environment variables."
        )

is_prod_valid, prod_error = Config.validate_production()
if not is_prod_valid and not Config.DEBUG:
    logger.error(f"Production configuration invalid: {prod_error}")
    raise ValueError(f"Invalid production configuration: {prod_error}")

blockchain_service = BlockchainService()

from src.api.v1.routes import set_limiter
set_limiter(limiter)

# Initialize API documentation BEFORE registering blueprint
# Flask-RESTX needs to add routes to the blueprint before it's registered
try:
    from src.api.v1.docs import init_api
    init_api()  # Initialize the API docs before blueprint is registered
except ImportError:
    pass

app.register_blueprint(api_v1)

logger.info(f"Blockchain initialized with {blockchain_service.get_block_count()} blocks")


@app.after_request
def after_request(response):
    response.headers.add(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, post-check=0, pre-check=0'
    )
    return response


@app.route('/', methods=['GET'])
def index():
    return render_template("index.html")


@app.route('/', methods=['POST'])
@limiter.limit("10 per minute")
def parse_request():
    try:
        if request.form.get("name"):
            teacher_name = sanitize_string(request.form.get("name", ""), max_length=100)
            if not teacher_name:
                return render_template("index.html", error="Please enter a valid name")

            return render_template(
                "class.html",
                name=teacher_name,
                date=dt.date.today()
            )

        elif request.form.get("number"):
            teacher_name = sanitize_string(request.form.get("teacher_name", ""), max_length=100)
            course = sanitize_string(request.form.get("course", ""), max_length=200)
            year = sanitize_string(request.form.get("year", ""), max_length=50)
            number = request.form.get("number", "0")

            if not all([teacher_name, course, year]):
                return render_template(
                    "class.html",
                    error="Please fill all required fields",
                    name=teacher_name,
                    date=dt.date.today()
                )

            try:
                student_count = int(number)
                if student_count <= 0 or student_count > 500:
                    raise ValueError("Invalid student count")
            except ValueError:
                return render_template(
                    "class.html",
                    error="Please enter a valid number of students (1-500)",
                    name=teacher_name,
                    date=dt.date.today()
                )

            return render_template(
                "attendance.html",
                name=teacher_name,
                course=course,
                year=year,
                number=student_count,
                date=str(dt.date.today())
            )

        elif request.form.get("roll_no1"):
            form_dict = request.form.to_dict()
            
            present_students = []
            i = 1
            while form_dict.get(f"roll_no{i}"):
                roll_no = sanitize_string(form_dict.get(f"roll_no{i}", ""), max_length=50)
                if roll_no:
                    present_students.append(roll_no)
                i += 1

            attendance_data = {
                "teacher_name": sanitize_string(form_dict.get("teacher_name", ""), max_length=100),
                "date": form_dict.get("date", ""),
                "course": sanitize_string(form_dict.get("course", ""), max_length=200),
                "year": sanitize_string(form_dict.get("year", ""), max_length=50),
                "present_students": present_students,
            }

            is_valid, validated_data, error_msg = validate_attendance_form(attendance_data)
            
            if not is_valid:
                return render_template(
                    "result.html",
                    result=f"Error: {error_msg}"
                )

            form_dict_with_rolls = {f"roll_no{i+1}": roll for i, roll in enumerate(validated_data["present_students"])}
            form_dict_with_rolls.update({
                "teacher_name": validated_data["teacher_name"],
                "date": validated_data["date"].strftime("%Y-%m-%d"),
                "course": validated_data["course"],
                "year": validated_data["year"],
            })

            attendance_payload = {
                "teacher_name": validated_data["teacher_name"],
                "date": validated_data["date"].strftime("%Y-%m-%d"),
                "course": validated_data["course"],
                "year": validated_data["year"],
            }

            success, result = blockchain_service.add_attendance_block(
                form_dict_with_rolls, attendance_payload
            )

            if success and "added" in result.lower():
                result += " Blockchain automatically saved."

            return render_template("result.html", result=result)

        else:
            return render_template("index.html", error="Invalid form submission")

    except Exception as e:
        logger.error(f"Error in parse_request: {str(e)}", exc_info=True)
        return render_template("index.html", error=f"An error occurred: {str(e)}")


@app.route('/view.html', methods=['GET'])
def view():
    return render_template("class.html", view_mode=True)


@app.route('/view.html', methods=['POST'])
@limiter.limit("20 per minute")
def show_records():
    try:
        search_data = {
            "name": sanitize_string(request.form.get("name", ""), max_length=100),
            "course": sanitize_string(request.form.get("course", ""), max_length=200),
            "year": sanitize_string(request.form.get("year", ""), max_length=50),
            "date": request.form.get("date", ""),
            "number": request.form.get("number", "0"),
        }

        is_valid, validated_data, error_msg = validate_search_form(search_data)
        
        if not is_valid:
            return render_template(
                "class.html",
                view_mode=True,
                error=f"Validation error: {error_msg}"
            )

        search_form_dict = {
            "name": validated_data["name"],
            "course": validated_data["course"],
            "year": validated_data["year"],
            "date": validated_data["date"].strftime("%Y-%m-%d"),
            "number": str(validated_data["number"]),
        }

        success, attendance_data = blockchain_service.find_attendance_records(
            search_form_dict
        )

        if not success or attendance_data is None:
            return render_template(
                "view.html",
                name=validated_data["name"],
                course=validated_data["course"],
                year=validated_data["year"],
                date=validated_data["date"].strftime("%Y-%m-%d"),
                number=validated_data["number"],
                status=[],
                error="No records found for the specified criteria"
            )

        return render_template(
            "view.html",
            name=validated_data["name"],
            course=validated_data["course"],
            year=validated_data["year"],
            date=validated_data["date"].strftime("%Y-%m-%d"),
            number=validated_data["number"],
            status=attendance_data,
            success=f"Found attendance record with {len(attendance_data)} students present"
        )

    except Exception as e:
        logger.error(f"Error in show_records: {str(e)}", exc_info=True)
        return render_template(
            "class.html",
            view_mode=True,
            error=f"An error occurred: {str(e)}"
        )


@app.route('/result.html', methods=['GET'])
def check():
    try:
        integrity_result = blockchain_service.check_chain_integrity()
        stats = blockchain_service.get_stats()
        return render_template(
            "result.html",
            result=integrity_result,
            stats=stats
        )
    except Exception as e:
        logger.error(f"Error in check: {str(e)}", exc_info=True)
        return render_template(
            "result.html",
            result=f"Error checking blockchain: {str(e)}"
        )


@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def api_login():
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        password = data.get("password", "")

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        success, error_msg, result = auth_service.authenticate(username, password)
        
        if not success:
            return jsonify({"error": error_msg}), 401

        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error in api_login: {str(e)}", exc_info=True)
        return jsonify({"error": "Login failed"}), 500


@app.route('/api/auth/verify', methods=['GET'])
def api_verify():
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401

        token = auth_header.split(" ")[1] if " " in auth_header else None
        if not token:
            return jsonify({"error": "Invalid authorization header"}), 401

        is_valid, user_info = auth_service.verify_token(token)
        if not is_valid:
            return jsonify({"error": "Invalid or expired token"}), 401

        return jsonify(user_info), 200
    except Exception as e:
        logger.error(f"Error in api_verify: {str(e)}", exc_info=True)
        return jsonify({"error": "Verification failed"}), 500


@app.route('/api/stats', methods=['GET'])
@limiter.limit("30 per minute")
@auth_service.require_auth("read")
def api_stats():
    try:
        stats = blockchain_service.get_stats()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error in api_stats: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/records', methods=['GET'])
@limiter.limit("30 per minute")
@auth_service.require_auth("read")
def api_records():
    try:
        records = blockchain_service.get_all_records()
        return jsonify({"records": records, "count": len(records)})
    except Exception as e:
        logger.error(f"Error in api_records: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/analytics', methods=['GET'])
@limiter.limit("20 per minute")
@auth_service.require_auth("read")
def api_analytics():
    try:
        analytics = blockchain_service.get_analytics()
        return jsonify(analytics)
    except Exception as e:
        logger.error(f"Error in api_analytics: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/export/<format>', methods=['GET'])
@limiter.limit("10 per minute")
@auth_service.require_auth("read")
def api_export(format):
    try:
        success, message = blockchain_service.export_data(format)
        if success:
            return jsonify({"success": True, "message": message})
        else:
            return jsonify({"error": message}), 400
    except Exception as e:
        logger.error(f"Error in api_export: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/report', methods=['GET'])
@limiter.limit("20 per minute")
@auth_service.require_auth("read")
def api_report():
    try:
        format_type = request.args.get('format', 'json')
        report = blockchain_service.generate_report(format_type)
        
        if format_type == 'text':
            return report, 200, {'Content-Type': 'text/plain'}
        else:
            return report, 200, {'Content-Type': 'application/json'}
    except Exception as e:
        logger.error(f"Error in api_report: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/api/load', methods=['POST'])
@limiter.limit("5 per minute")
@auth_service.require_auth("write")
def api_load():
    try:
        success, message, blocks = blockchain_service.reload_blockchain()
        if success:
            return jsonify({
                "success": True,
                "message": message,
                "blocks": blocks
            })
        else:
            return jsonify({"success": False, "message": message}), 400
    except Exception as e:
        logger.error(f"Error in api_load: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    logger.info("Starting Blockendance - Blockchain-based Attendance System")
    logger.info(f"Blockchain initialized with {blockchain_service.get_block_count()} blocks")
    logger.info(f"Access the application at: http://{Config.HOST}:{Config.PORT}")
    app.run(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)
