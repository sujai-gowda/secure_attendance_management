import pytest
from blockchain_service import BlockchainService
from auth_service import AuthService
from block import Block
import datetime as dt


@pytest.fixture
def blockchain_service():
    service = BlockchainService(blockchain=[])
    return service


@pytest.fixture
def auth_service():
    service = AuthService()
    return service


@pytest.fixture
def sample_block():
    data = {
        "type": "attendance",
        "teacher_name": "Test Teacher",
        "date": "2024-01-01",
        "course": "Test Course",
        "year": "2024",
        "present_students": ["001", "002", "003"]
    }
    return Block(0, dt.datetime.now(), data, "0")


@pytest.fixture
def sample_attendance_data():
    return {
        "teacher_name": "Test Teacher",
        "date": "2024-01-01",
        "course": "Test Course",
        "year": "2024",
        "present_students": ["001", "002", "003"]
    }

