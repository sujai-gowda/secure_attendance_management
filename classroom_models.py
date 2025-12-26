from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any


def _parse_datetime(value: Any) -> datetime:
    if not value:
        return datetime.utcnow()
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    raise ValueError(f"Unsupported datetime value: {value}")


@dataclass
class StudentProfile:
    roll_number: str
    name: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "roll_number": self.roll_number,
            "name": self.name,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "StudentProfile":
        return cls(
            roll_number=str(data.get("roll_number", "")).strip(),
            name=str(data.get("name", "")).strip(),
        )


@dataclass
class Classroom:
    id: str
    name: str
    description: str = ""
    expected_student_count: int = 0
    students: List[StudentProfile] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "expected_student_count": self.expected_student_count,
            "students": [student.to_dict() for student in self.students],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Classroom":
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            description=data.get("description", "") or "",
            expected_student_count=int(data.get("expected_student_count") or 0),
            students=[StudentProfile.from_dict(entry) for entry in data.get("students", [])],
            created_at=_parse_datetime(data.get("created_at")),
            updated_at=_parse_datetime(data.get("updated_at")),
        )

    def has_roll_number(self, roll_number: str) -> bool:
        normalized = roll_number.strip().lower()
        return any(student.roll_number.strip().lower() == normalized for student in self.students)

