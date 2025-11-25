"""
Student Database Module
Stores teacher + branch (course) -> student registration numbers mapping
Uses JSON file for persistence
"""

import json
import os
from typing import List, Dict, Optional

STUDENT_DB_FILE = "student_database.json"

def load_student_db():
    """
    Load student database from JSON file
    Returns a dictionary with structure:
    {
        "teacher_name": {
            "course": {
                "year": {
                    "student_count": int,
                    "registration_numbers": [str, ...]
                }
            }
        }
    }
    """
    if not os.path.exists(STUDENT_DB_FILE):
        return {}
    
    try:
        with open(STUDENT_DB_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}

def save_student_db(db: Dict):
    """Save student database to JSON file"""
    try:
        with open(STUDENT_DB_FILE, 'w') as f:
            json.dump(db, f, indent=2)
        return True, "Student database saved successfully"
    except IOError as e:
        return False, f"Error saving student database: {str(e)}"

def check_class_exists(teacher_name: str, course: str, year: str) -> bool:
    """
    Check if a class (teacher + course + year) already exists in the database
    """
    db = load_student_db()
    return (teacher_name in db and 
            course in db.get(teacher_name, {}) and 
            year in db.get(teacher_name, {}).get(course, {}))

def get_students(teacher_name: str, course: str, year: str) -> Optional[Dict]:
    """
    Get student list for a specific class
    Returns None if class doesn't exist, otherwise returns:
    {
        "student_count": int,
        "registration_numbers": [str, ...]
    }
    """
    db = load_student_db()
    if check_class_exists(teacher_name, course, year):
        return db[teacher_name][course][year]
    return None

def save_students(teacher_name: str, course: str, year: str, 
                  registration_numbers: List[str]) -> tuple:
    """
    Save student registration numbers for a class
    Returns (success: bool, message: str)
    """
    db = load_student_db()
    
    # Initialize nested structure if needed
    if teacher_name not in db:
        db[teacher_name] = {}
    if course not in db[teacher_name]:
        db[teacher_name][course] = {}
    
    # Save student data
    db[teacher_name][course][year] = {
        "student_count": len(registration_numbers),
        "registration_numbers": registration_numbers
    }
    
    return save_student_db(db)

def update_students(teacher_name: str, course: str, year: str, 
                    registration_numbers: List[str]) -> tuple:
    """
    Update student registration numbers for an existing class
    Returns (success: bool, message: str)
    """
    if not check_class_exists(teacher_name, course, year):
        return False, "Class does not exist. Use save_students() instead."
    
    return save_students(teacher_name, course, year, registration_numbers)

def get_all_classes() -> List[Dict]:
    """
    Get list of all classes in the database
    Returns list of dictionaries with teacher_name, course, year, student_count
    """
    db = load_student_db()
    classes = []
    
    for teacher_name, courses in db.items():
        for course, years in courses.items():
            for year, data in years.items():
                classes.append({
                    "teacher_name": teacher_name,
                    "course": course,
                    "year": year,
                    "student_count": data.get("student_count", 0)
                })
    
    return classes

def delete_class(teacher_name: str, course: str, year: str) -> tuple:
    """
    Delete a class from the database
    Returns (success: bool, message: str)
    """
    db = load_student_db()
    
    if not check_class_exists(teacher_name, course, year):
        return False, "Class does not exist"
    
    try:
        del db[teacher_name][course][year]
        
        # Clean up empty nested dictionaries
        if not db[teacher_name][course]:
            del db[teacher_name][course]
        if not db[teacher_name]:
            del db[teacher_name]
        
        return save_student_db(db)
    except KeyError:
        return False, "Error deleting class"





