#!/usr/bin/env python3
"""
Script to add dummy attendance data to the blockchain for testing purposes.
This script directly uses the BlockchainService to add blocks without requiring API authentication.
"""

import sys
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

from src.services.blockchain_service import BlockchainService
from src.config.config import Config

TEACHERS = [
    "Dr. Smith",
    "Prof. Johnson",
    "Dr. Williams",
    "Prof. Brown",
    "Dr. Davis",
    "Prof. Miller",
]

COURSES = [
    "Data Structures and Algorithms",
    "Database Management Systems",
    "Computer Networks",
    "Operating Systems",
    "Software Engineering",
    "Machine Learning",
    "Web Development",
    "Mobile App Development",
]

YEARS = ["2024", "2025"]

STUDENT_ROLL_NUMBERS = [
    f"{year}{str(i).zfill(3)}" for year in ["2024", "2025"] for i in range(1, 51)
]


def generate_dummy_attendance_data(count: int = 20) -> List[Dict[str, Any]]:
    """Generate dummy attendance data"""
    attendance_records = []
    
    for i in range(count):
        teacher = random.choice(TEACHERS)
        course = random.choice(COURSES)
        year = random.choice(YEARS)
        
        start_date = datetime.now() - timedelta(days=30)
        random_date = start_date + timedelta(days=random.randint(0, 30))
        date_str = random_date.strftime("%Y-%m-%d")
        
        num_students = random.randint(15, 40)
        present_students = random.sample(STUDENT_ROLL_NUMBERS, min(num_students, len(STUDENT_ROLL_NUMBERS)))
        
        attendance_records.append({
            "teacher_name": teacher,
            "course": course,
            "date": date_str,
            "year": year,
            "present_students": present_students,
        })
    
    return attendance_records


def add_dummy_data(blockchain_service: BlockchainService, count: int = 20):
    """Add dummy attendance data to the blockchain"""
    print(f"Generating {count} dummy attendance records...")
    attendance_records = generate_dummy_attendance_data(count)
    
    print(f"\nAdding {len(attendance_records)} attendance blocks to blockchain...")
    print("-" * 60)
    
    success_count = 0
    error_count = 0
    
    for idx, record in enumerate(attendance_records, 1):
        form_data = {
            f"roll_no{i+1}": roll_no
            for i, roll_no in enumerate(record["present_students"])
        }
        
        attendance_data = {
            "teacher_name": record["teacher_name"],
            "date": record["date"],
            "course": record["course"],
            "year": record["year"],
        }
        
        success, message = blockchain_service.add_attendance_block(
            form_data, attendance_data
        )
        
        if success:
            success_count += 1
            print(f"[OK] [{idx}/{len(attendance_records)}] {message}")
        else:
            error_count += 1
            print(f"[ERROR] [{idx}/{len(attendance_records)}] Error: {message}")
    
    print("-" * 60)
    print(f"\nSummary:")
    print(f"  Successfully added: {success_count} blocks")
    print(f"  Errors: {error_count} blocks")
    print(f"  Total blocks in blockchain: {blockchain_service.get_block_count()}")


def main():
    """Main function"""
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
            if count <= 0:
                print("Error: Count must be a positive integer")
                sys.exit(1)
        except ValueError:
            print("Error: Count must be a valid integer")
            sys.exit(1)
    else:
        count = 20
    
    print("=" * 60)
    print("Dummy Data Generator for Blockchain Attendance System")
    print("=" * 60)
    print(f"\nConfiguration:")
    print(f"  Blockchain file: {Config.BLOCKCHAIN_FILE}")
    print(f"  Use database: {Config.USE_DATABASE}")
    print(f"  Records to add: {count}")
    print()
    
    try:
        blockchain_service = BlockchainService()
        current_block_count = blockchain_service.get_block_count()
        print(f"Current blockchain has {current_block_count} block(s)")
        print()
        
        add_dummy_data(blockchain_service, count)
        
        print("\n[SUCCESS] Dummy data generation completed!")
        
    except Exception as e:
        print(f"\n[ERROR] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
