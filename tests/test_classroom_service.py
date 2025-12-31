import json
from datetime import datetime

import pytest

from src.services.classroom_service import ClassroomService, JsonClassroomRepository
from src.models.classroom_models import StudentProfile


def build_repository(tmp_path):
    storage_path = tmp_path / "classes.json"
    return JsonClassroomRepository(filepath=str(storage_path))


def test_create_classroom_enforces_unique_name(tmp_path):
    repo = build_repository(tmp_path)
    service = ClassroomService(repository=repo, seed=False)

    created = service.create_classroom("CSE A", expected_student_count=10)
    assert created.name == "CSE A"

    with pytest.raises(ValueError):
        service.create_classroom("cse a", expected_student_count=15)


def test_add_students_prevents_duplicate_roll_numbers(tmp_path):
    repo = build_repository(tmp_path)
    service = ClassroomService(repository=repo, seed=False)

    classroom = service.create_classroom("Mathematics", expected_student_count=2)
    updated = service.add_students_to_class(
        classroom.id,
        [
            {"roll_number": "MATH001", "name": "Ana Rao"},
            StudentProfile(roll_number="MATH002", name="Ben Jose"),
        ],
    )
    assert len(updated.students) == 2

    with pytest.raises(ValueError):
        service.add_students_to_class(
            classroom.id,
            [{"roll_number": "MATH001", "name": "Duplicate Student"}],
        )


def test_seed_from_file_populates_repository(tmp_path):
    seed_payload = {
        "metadata": {
            "created": datetime.utcnow().isoformat(),
            "version": "1.0",
            "total_classes": 1,
        },
        "classes": [
            {
                "id": "CLS-SEED-1",
                "name": "Seeded Class",
                "description": "",
                "expected_student_count": 1,
                "students": [
                    {"roll_number": "SEED01", "name": "Seed Student"},
                ],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
        ],
    }
    seed_path = tmp_path / "seed.json"
    seed_path.write_text(json.dumps(seed_payload), encoding="utf-8")

    repo = build_repository(tmp_path)
    service = ClassroomService(repository=repo, seed=False)

    added = service.seed_from_file(seed_file=str(seed_path))
    assert added == 1
    classrooms = service.list_classrooms()
    assert len(classrooms) == 1
    assert classrooms[0].name == "Seeded Class"

