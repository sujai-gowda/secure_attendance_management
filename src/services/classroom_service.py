import json
import logging
import threading
import uuid
from pathlib import Path
from typing import List, Optional, Sequence, Protocol, Union
from datetime import datetime

from src.config.config import Config
from src.models.classroom_models import Classroom, StudentProfile

logger = logging.getLogger(__name__)


class ClassroomRepository(Protocol):
    def list_classrooms(self) -> List[Classroom]:
        ...

    def get_classroom(self, class_id: str) -> Optional[Classroom]:
        ...

    def get_classroom_by_name(self, name: str) -> Optional[Classroom]:
        ...

    def save_classroom(self, classroom: Classroom) -> Classroom:
        ...

    def add_students(self, class_id: str, students: List[StudentProfile]) -> Classroom:
        ...

    def delete_classroom(self, class_id: str) -> bool:
        ...


class JsonClassroomRepository:
    def __init__(self, filepath: Optional[str] = None):
        self.filepath = Path(filepath or Config.CLASSES_FILE)
        self._lock = threading.RLock()
        self._ensure_file_initialized()

    def _ensure_file_initialized(self) -> None:
        if self.filepath.exists():
            return
        payload = {
            "metadata": {
                "created": datetime.utcnow().isoformat(),
                "version": "1.0",
                "total_classes": 0,
            },
            "classes": [],
        }
        self.filepath.parent.mkdir(parents=True, exist_ok=True)
        with self.filepath.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)

    def _read_payload(self) -> dict:
        with self.filepath.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _write_payload(self, payload: dict) -> None:
        payload.setdefault("metadata", {})
        payload["metadata"]["updated"] = datetime.utcnow().isoformat()
        payload["metadata"]["total_classes"] = len(payload.get("classes", []))
        with self.filepath.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)

    def list_classrooms(self) -> List[Classroom]:
        with self._lock:
            payload = self._read_payload()
            return [Classroom.from_dict(entry) for entry in payload.get("classes", [])]

    def get_classroom(self, class_id: str) -> Optional[Classroom]:
        if not class_id:
            return None
        with self._lock:
            payload = self._read_payload()
            for entry in payload.get("classes", []):
                if entry.get("id") == class_id:
                    return Classroom.from_dict(entry)
        return None

    def get_classroom_by_name(self, name: str) -> Optional[Classroom]:
        if not name:
            return None
        normalized = name.strip().lower()
        with self._lock:
            payload = self._read_payload()
            for entry in payload.get("classes", []):
                if entry.get("name", "").strip().lower() == normalized:
                    return Classroom.from_dict(entry)
        return None

    def save_classroom(self, classroom: Classroom) -> Classroom:
        with self._lock:
            payload = self._read_payload()
            classes = payload.get("classes", [])
            updated = False
            for idx, entry in enumerate(classes):
                if entry.get("id") == classroom.id:
                    classes[idx] = classroom.to_dict()
                    updated = True
                    break
            if not updated:
                classes.append(classroom.to_dict())
            payload["classes"] = classes
            self._write_payload(payload)
        return classroom

    def add_students(self, class_id: str, students: List[StudentProfile]) -> Classroom:
        if not students:
            raise ValueError("At least one student must be provided")
        with self._lock:
            payload = self._read_payload()
            classes = payload.get("classes", [])
            for idx, entry in enumerate(classes):
                if entry.get("id") == class_id:
                    classroom = Classroom.from_dict(entry)
                    classroom.students.extend(students)
                    classroom.updated_at = datetime.utcnow()
                    classes[idx] = classroom.to_dict()
                    payload["classes"] = classes
                    self._write_payload(payload)
                    return classroom
        raise ValueError(f"Classroom {class_id} not found")

    def delete_classroom(self, class_id: str) -> bool:
        """Delete a classroom by ID."""
        if not class_id:
            return False
            
        with self._lock:
            payload = self._read_payload()
            classes = payload.get("classes", [])
            initial_len = len(classes)
            filtered_classes = [c for c in classes if c.get("id") != class_id]
            
            if len(filtered_classes) == initial_len:
                return False
                
            payload["classes"] = filtered_classes
            self._write_payload(payload)
            return True


class ClassroomService:
    def __init__(
        self,
        repository: Optional[ClassroomRepository] = None,
        seed: bool = True,
    ):
        self._repository = repository or self._build_repository()
        self._lock = threading.RLock()
        if seed:
            try:
                self.seed_from_file()
            except Exception as exc:
                logger.warning("Failed to seed classrooms: %s", exc)

    def _build_repository(self) -> ClassroomRepository:
        if Config.USE_DATABASE:
            from src.services.database_service import DatabaseClassroomRepository

            return DatabaseClassroomRepository()
        return JsonClassroomRepository()

    def list_classrooms(self) -> List[Classroom]:
        return self._repository.list_classrooms()

    def get_classroom(self, class_id: str) -> Optional[Classroom]:
        return self._repository.get_classroom(class_id)

    def create_classroom(
        self,
        name: str,
        expected_student_count: int,
        description: str = "",
    ) -> Classroom:
        sanitized_name = self._sanitize_name(name)
        if expected_student_count < 0:
            raise ValueError("Expected student count must be zero or positive")

        with self._lock:
            if self._repository.get_classroom_by_name(sanitized_name):
                raise ValueError(f"Classroom named '{sanitized_name}' already exists")

            classroom = Classroom(
                id=self._generate_class_id(),
                name=sanitized_name,
                description=description.strip(),
                expected_student_count=expected_student_count,
                students=[],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            saved = self._repository.save_classroom(classroom)
            logger.info("Created classroom %s (%s)", saved.name, saved.id)
            return saved

    def add_students_to_class(
        self,
        class_id: str,
        students: Sequence[Union[StudentProfile, dict]],
    ) -> Classroom:
        if not students:
            raise ValueError("No students supplied")

        with self._lock:
            classroom = self._repository.get_classroom(class_id)
            if not classroom:
                raise ValueError(f"Classroom {class_id} not found")

            existing_rolls = {student.roll_number.strip().lower() for student in classroom.students}
            new_students: List[StudentProfile] = []

            for entry in students:
                student = self._coerce_student(entry)
                normalized_roll = student.roll_number.strip().lower()
                if not student.name:
                    raise ValueError("Student name is required")
                if not student.roll_number:
                    raise ValueError("Student roll number is required")
                if normalized_roll in existing_rolls:
                    raise ValueError(f"Roll number '{student.roll_number}' already exists in class")
                existing_rolls.add(normalized_roll)
                new_students.append(student)

            updated_classroom = self._repository.add_students(class_id, new_students)
            logger.info(
                "Added %s students to class %s",
                len(new_students),
                updated_classroom.id,
            )
            return updated_classroom

    def delete_classroom(self, class_id: str) -> bool:
        """Delete a classroom by ID."""
        if not class_id:
            return False
            
        with self._lock:
            result = self._repository.delete_classroom(class_id)
            if result:
                logger.info("Deleted classroom %s", class_id)
            else:
                logger.warning("Attempted to delete non-existent classroom %s", class_id)
            return result

    def seed_from_file(self, seed_file: Optional[str] = None) -> int:
        seed_path = Path(seed_file or Config.CLASSES_FILE)
        if not seed_path.exists():
            return 0

        with seed_path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)

        added = 0
        classes = payload.get("classes", [])
        if not isinstance(classes, list):
            return 0

        for entry in classes:
            classroom = Classroom.from_dict(entry)
            existing = self._repository.get_classroom(classroom.id) or self._repository.get_classroom_by_name(
                classroom.name
            )
            if existing:
                continue
            self._repository.save_classroom(classroom)
            added += 1

        if added:
            logger.info("Seeded %s classroom(s) from %s", added, seed_path)
        return added

    def _sanitize_name(self, name: str) -> str:
        sanitized = (name or "").strip()
        if not sanitized:
            raise ValueError("Classroom name is required")
        return sanitized

    def _generate_class_id(self) -> str:
        return f"CLS-{uuid.uuid4().hex[:8].upper()}"

    def _coerce_student(self, entry: Union[StudentProfile, dict]) -> StudentProfile:
        if isinstance(entry, StudentProfile):
            return StudentProfile(
                roll_number=entry.roll_number.strip(),
                name=entry.name.strip(),
            )
        if not isinstance(entry, dict):
            raise ValueError("Student entry must be a dict or StudentProfile")
        return StudentProfile(
            roll_number=str(entry.get("roll_number", "")).strip(),
            name=str(entry.get("name", "")).strip(),
        )

