import pytest
from flask import Flask
import blockchain as blockchain_app
from blockchain import app
from blockchain_service import BlockchainService
from auth_service import auth_service
from config import Config


@pytest.fixture
def client(tmp_path):
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    Config.CLASSES_FILE = str(tmp_path / "classes_test_data.json")
    Config.BLOCKCHAIN_FILE = str(tmp_path / "blockchain_test_chain.json")
    blockchain_app.blockchain_service = BlockchainService(blockchain=[])
    
    with app.test_client() as client:
        yield client


@pytest.fixture
def auth_token(client):
    response = client.post('/api/v1/auth/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    data = response.get_json()
    return data['data']['token']


class TestAPIIntegration:
    def test_login_success(self, client):
        response = client.post('/api/v1/auth/login', json={
            'username': 'admin',
            'password': 'admin123'
        })

        assert response.status_code == 200
        payload = response.get_json()
        assert payload['success'] is True
        assert 'token' in payload['data']
        assert payload['data']['user']['username'] == 'admin'

    def test_login_invalid_credentials(self, client):
        response = client.post('/api/v1/auth/login', json={
            'username': 'admin',
            'password': 'wrongpassword'
        })

        assert response.status_code == 401

    def test_verify_token_success(self, client, auth_token):
        response = client.get('/api/v1/auth/verify', headers={
            'Authorization': f'Bearer {auth_token}'
        })

        assert response.status_code == 200
        data = response.get_json()['data']
        assert data['username'] == 'admin'
        assert data['role'] == 'admin'

    def test_verify_token_invalid(self, client):
        response = client.get('/api/v1/auth/verify', headers={
            'Authorization': 'Bearer invalid_token'
        })

        assert response.status_code == 401

    def test_api_stats_public_access(self, client):
        response = client.get('/api/v1/stats')

        assert response.status_code == 200
        data = response.get_json()['data']
        assert 'total_blocks' in data

    def test_api_stats_with_auth(self, client, auth_token):
        response = client.get('/api/v1/stats', headers={
            'Authorization': f'Bearer {auth_token}'
        })

        assert response.status_code == 200
        data = response.get_json()['data']
        assert data['total_blocks'] >= 1

    def test_api_records_public_access(self, client):
        response = client.get('/api/v1/records')

        assert response.status_code == 200
        payload = response.get_json()['data']
        assert 'data' in payload
        assert 'pagination' in payload

    def test_api_records_with_auth(self, client, auth_token):
        response = client.get('/api/v1/records', headers={
            'Authorization': f'Bearer {auth_token}'
        })

        assert response.status_code == 200
        payload = response.get_json()['data']
        assert isinstance(payload['data'], list)
        assert 'pagination' in payload

    def test_api_analytics_public_access(self, client):
        response = client.get('/api/v1/analytics')

        assert response.status_code == 200
        data = response.get_json()['data']
        assert 'overview' in data

    def test_api_analytics_with_auth(self, client, auth_token):
        response = client.get('/api/v1/analytics', headers={
            'Authorization': f'Bearer {auth_token}'
        })

        assert response.status_code == 200
        data = response.get_json()['data']
        assert 'overview' in data


class TestClassroomAPI:
    """Integration tests for classroom endpoints"""
    
    def test_create_classroom_success(self, client):
        """Test creating a classroom with valid data"""
        response = client.post('/api/v1/classrooms', json={
            'name': 'Mathematics 101',
            'expected_student_count': 30,
            'description': 'Introduction to Mathematics'
        })
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        assert data['data']['name'] == 'Mathematics 101'
        assert data['data']['expected_student_count'] == 30
        assert data['data']['description'] == 'Introduction to Mathematics'
        assert 'id' in data['data']
        assert data['data']['current_student_count'] == 0
    
    def test_create_classroom_duplicate_name(self, client):
        """Test that duplicate class names are rejected"""
        # Create first classroom
        response1 = client.post('/api/v1/classrooms', json={
            'name': 'Physics 201',
            'expected_student_count': 25
        })
        assert response1.status_code == 201
        
        # Try to create duplicate (case-insensitive)
        response2 = client.post('/api/v1/classrooms', json={
            'name': 'physics 201',
            'expected_student_count': 30
        })
        assert response2.status_code == 400
        data = response2.get_json()
        assert 'error' in data
        assert 'already exists' in data['message'].lower()
    
    def test_create_classroom_validation_errors(self, client):
        """Test validation errors for classroom creation"""
        # Missing required fields
        response = client.post('/api/v1/classrooms', json={})
        assert response.status_code == 400
        
        # Invalid student count (negative)
        response = client.post('/api/v1/classrooms', json={
            'name': 'Test Class',
            'expected_student_count': -5
        })
        assert response.status_code == 400
    
    def test_list_classrooms(self, client):
        """Test listing all classrooms"""
        # Create a few classrooms
        client.post('/api/v1/classrooms', json={
            'name': 'Class A',
            'expected_student_count': 20
        })
        client.post('/api/v1/classrooms', json={
            'name': 'Class B',
            'expected_student_count': 25
        })
        
        # List all classrooms
        response = client.get('/api/v1/classrooms')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        assert isinstance(data['data'], list)
        assert len(data['data']) >= 2
    
    def test_get_classroom_success(self, client):
        """Test retrieving a specific classroom"""
        # Create a classroom
        create_response = client.post('/api/v1/classrooms', json={
            'name': 'Chemistry Lab',
            'expected_student_count': 15,
            'description': 'Lab session'
        })
        assert create_response.status_code == 201
        class_id = create_response.get_json()['data']['id']
        
        # Retrieve the classroom
        response = client.get(f'/api/v1/classrooms/{class_id}')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['data']['id'] == class_id
        assert data['data']['name'] == 'Chemistry Lab'
        assert data['data']['expected_student_count'] == 15
        assert data['data']['current_student_count'] == 0
    
    def test_get_classroom_not_found(self, client):
        """Test retrieving a non-existent classroom"""
        response = client.get('/api/v1/classrooms/NONEXISTENT')
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data
        assert 'not found' in data['message'].lower()
    
    def test_add_students_to_classroom_success(self, client):
        """Test adding students to a classroom"""
        # Create a classroom
        create_response = client.post('/api/v1/classrooms', json={
            'name': 'Test Class',
            'expected_student_count': 5
        })
        class_id = create_response.get_json()['data']['id']
        
        # Add students
        response = client.post(f'/api/v1/classrooms/{class_id}/students', json={
            'students': [
                {'roll_number': 'ROLL001', 'name': 'Alice Smith'},
                {'roll_number': 'ROLL002', 'name': 'Bob Johnson'}
            ]
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert len(data['data']['students']) == 2
        assert data['data']['current_student_count'] == 2
        
        # Verify students are in the roster
        student_rolls = [s['roll_number'] for s in data['data']['students']]
        assert 'ROLL001' in student_rolls
        assert 'ROLL002' in student_rolls
    
    def test_add_students_duplicate_roll_number(self, client):
        """Test that duplicate roll numbers are rejected"""
        # Create a classroom
        create_response = client.post('/api/v1/classrooms', json={
            'name': 'Test Class',
            'expected_student_count': 10
        })
        class_id = create_response.get_json()['data']['id']
        
        # Add first student
        client.post(f'/api/v1/classrooms/{class_id}/students', json={
            'students': [{'roll_number': 'DUP001', 'name': 'First Student'}]
        })
        
        # Try to add duplicate roll number
        response = client.post(f'/api/v1/classrooms/{class_id}/students', json={
            'students': [{'roll_number': 'DUP001', 'name': 'Duplicate Student'}]
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'already exists' in data['message'].lower()
    
    def test_add_students_max_count_validation(self, client):
        """Test that max student count is enforced"""
        # Create a classroom with max 2 students
        create_response = client.post('/api/v1/classrooms', json={
            'name': 'Small Class',
            'expected_student_count': 2
        })
        class_id = create_response.get_json()['data']['id']
        
        # Add 2 students (should succeed)
        response1 = client.post(f'/api/v1/classrooms/{class_id}/students', json={
            'students': [
                {'roll_number': 'S001', 'name': 'Student 1'},
                {'roll_number': 'S002', 'name': 'Student 2'}
            ]
        })
        assert response1.status_code == 200
        
        # Try to add more students (should fail)
        response2 = client.post(f'/api/v1/classrooms/{class_id}/students', json={
            'students': [{'roll_number': 'S003', 'name': 'Student 3'}]
        })
        assert response2.status_code == 400
        data = response2.get_json()
        assert 'error' in data
        assert 'maximum' in data['message'].lower()
    
    def test_add_students_to_nonexistent_classroom(self, client):
        """Test adding students to a non-existent classroom"""
        response = client.post('/api/v1/classrooms/NONEXISTENT/students', json={
            'students': [{'roll_number': 'R001', 'name': 'Test Student'}]
        })
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data
        assert 'not found' in data['message'].lower()
    
    def test_add_students_validation_errors(self, client):
        """Test validation errors when adding students"""
        # Create a classroom
        create_response = client.post('/api/v1/classrooms', json={
            'name': 'Test Class',
            'expected_student_count': 10
        })
        class_id = create_response.get_json()['data']['id']
        
        # Missing required fields
        response = client.post(f'/api/v1/classrooms/{class_id}/students', json={
            'students': [{'roll_number': 'R001'}]  # Missing name
        })
        assert response.status_code == 400
        
        # Empty students list
        response = client.post(f'/api/v1/classrooms/{class_id}/students', json={
            'students': []
        })
        assert response.status_code == 400
    
    def test_get_classroom_roster_for_attendance(self, client):
        """Test retrieving class roster for attendance entry"""
        # Create a classroom with students
        create_response = client.post('/api/v1/classrooms', json={
            'name': 'Attendance Test Class',
            'expected_student_count': 3
        })
        class_id = create_response.get_json()['data']['id']
        
        # Add students
        client.post(f'/api/v1/classrooms/{class_id}/students', json={
            'students': [
                {'roll_number': 'A001', 'name': 'Alice'},
                {'roll_number': 'A002', 'name': 'Bob'},
                {'roll_number': 'A003', 'name': 'Charlie'}
            ]
        })
        
        # Retrieve roster
        response = client.get(f'/api/v1/classrooms/{class_id}')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert len(data['data']['students']) == 3
        assert data['data']['current_student_count'] == 3
        
        # Verify roster structure for attendance
        students = data['data']['students']
        assert all('roll_number' in s and 'name' in s for s in students)


class TestAttendanceWorkflow:
    """Integration tests for class-aware attendance submissions"""

    def _create_class_with_students(self, client, student_rolls=None):
        create_response = client.post('/api/v1/classrooms', json={
            'name': 'Attendance Class',
            'expected_student_count': 10
        })
        assert create_response.status_code == 201
        class_id = create_response.get_json()['data']['id']

        students = [
            {'roll_number': roll, 'name': f'Student {roll}'}
            for roll in (student_rolls or ['R001', 'R002'])
        ]
        add_response = client.post(f'/api/v1/classrooms/{class_id}/students', json={'students': students})
        assert add_response.status_code == 200
        return class_id, students

    def test_submit_attendance_with_valid_class(self, client):
        class_id, students = self._create_class_with_students(client)
        payload = {
            'teacher_name': 'Ms. Valid',
            'course': 'Mathematics',
            'date': '2024-01-10',
            'year': '2024',
            'class_id': class_id,
            'present_students': [students[0]['roll_number']]
        }

        response = client.post('/api/v1/attendance', json=payload)

        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert data['data']['class_id'] == class_id
        assert data['data']['students_count'] == 1

    def test_submit_attendance_rejects_unknown_roll(self, client):
        class_id, _ = self._create_class_with_students(client)
        payload = {
            'teacher_name': 'Ms. Valid',
            'course': 'Mathematics',
            'date': '2024-01-10',
            'year': '2024',
            'class_id': class_id,
            'present_students': ['UNKNOWN']
        }

        response = client.post('/api/v1/attendance', json=payload)

        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == 'validation_error'
        assert 'not part of classroom' in data['message'].lower()