import pytest
from blockchain_service import BlockchainService
from block import Block
import datetime as dt


class TestBlockchainService:
    def test_initialization(self, blockchain_service):
        assert blockchain_service is not None
        assert blockchain_service.get_block_count() >= 1

    def test_add_attendance_block_success(self, blockchain_service):
        form_data = {
            "roll_no1": "001",
            "roll_no2": "002",
            "roll_no3": "003",
        }
        attendance_data = [
            "Test Teacher",
            "2024-01-01",
            "Test Course",
            "2024"
        ]

        success, result = blockchain_service.add_attendance_block(
            form_data, attendance_data
        )

        assert success is True
        assert "added" in result.lower()
        assert blockchain_service.get_block_count() >= 2

    def test_add_attendance_block_no_students(self, blockchain_service):
        form_data = {}
        attendance_data = [
            "Test Teacher",
            "2024-01-01",
            "Test Course",
            "2024"
        ]

        success, result = blockchain_service.add_attendance_block(
            form_data, attendance_data
        )

        assert success is False
        assert "no students" in result.lower()

    def test_find_attendance_records_success(self, blockchain_service):
        form_data = {
            "roll_no1": "001",
            "roll_no2": "002",
        }
        attendance_data = [
            "Test Teacher",
            "2024-01-01",
            "Test Course",
            "2024"
        ]

        blockchain_service.add_attendance_block(form_data, attendance_data)

        search_criteria = {
            "name": "Test Teacher",
            "date": "2024-01-01",
            "course": "Test Course",
            "year": "2024",
            "number": "2"
        }

        success, records = blockchain_service.find_attendance_records(search_criteria)

        assert success is True
        assert records is not None
        assert len(records) == 2

    def test_find_attendance_records_not_found(self, blockchain_service):
        search_criteria = {
            "name": "Non Existent",
            "date": "2024-01-01",
            "course": "Test Course",
            "year": "2024",
            "number": "2"
        }

        success, records = blockchain_service.find_attendance_records(search_criteria)

        assert success is False
        assert records is None

    def test_check_chain_integrity(self, blockchain_service):
        result = blockchain_service.check_chain_integrity()
        assert "verified" in result.lower() or "genesis" in result.lower()

    def test_get_stats(self, blockchain_service):
        stats = blockchain_service.get_stats()
        assert "total_blocks" in stats
        assert stats["total_blocks"] >= 1

    def test_get_analytics(self, blockchain_service):
        analytics = blockchain_service.get_analytics()
        assert "overview" in analytics
        assert "by_teacher" in analytics
        assert "by_course" in analytics

    def test_get_all_records(self, blockchain_service):
        records = blockchain_service.get_all_records()
        assert isinstance(records, list)

