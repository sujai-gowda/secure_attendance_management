from typing import List, Dict, Any, Union
from block import Block


def find_records(
    form: Dict[str, Any], blockchain: List[Block]
) -> Union[List[str], int]:
    try:
        search_name = form.get("name", "").strip()
        search_date = form.get("date", "").strip()
        search_course = form.get("course", "").strip()
        search_year = form.get("year", "").strip()
        expected_count = int(form.get("number", 0))

        for block in blockchain:
            if block.index == 0:
                continue

            if not isinstance(block.data, dict) or block.data.get("type") != "attendance":
                continue

            block_data = block.data

        conditions = [
            block_data.get("teacher_name", "") == search_name,
            block_data.get("date", "") == search_date,
            block_data.get("course", "") == search_course,
            block_data.get("year", "") == search_year,
        ]
        
        if expected_count > 0:
            conditions.append(len(block_data.get("present_students", [])) == expected_count)

        if all(conditions):
            return block_data.get("present_students", [])

        return -1

    except (ValueError, TypeError) as e:
        return -1


def get_all_attendance_records(blockchain: List[Block]) -> List[Dict[str, Any]]:
    records = []
    for block in blockchain:
        if (
            block.index > 0
            and isinstance(block.data, dict)
            and block.data.get("type") == "attendance"
        ):
            records.append({
                "block_index": block.index,
                "timestamp": block.timestamp,
                "teacher_name": block.data.get("teacher_name", ""),
                "date": block.data.get("date", ""),
                "course": block.data.get("course", ""),
                "year": block.data.get("year", ""),
                "present_students": block.data.get("present_students", []),
                "student_count": len(block.data.get("present_students", []))
            })
    return records


def search_by_student(blockchain: List[Block], roll_no: str) -> List[Dict[str, Any]]:
    student_records = []
    for block in blockchain:
        if (
            block.index > 0
            and isinstance(block.data, dict)
            and block.data.get("type") == "attendance"
        ):
            if roll_no in block.data.get("present_students", []):
                student_records.append({
                    "date": block.data.get("date", ""),
                    "course": block.data.get("course", ""),
                    "year": block.data.get("year", ""),
                    "teacher_name": block.data.get("teacher_name", "")
                })
    return student_records
