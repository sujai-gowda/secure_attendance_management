"""
Phase 1: Validation and Testing Script
Tests all core flows to ensure the application works correctly after refactoring.
"""

import sys
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5001"
API_BASE = f"{BASE_URL}/api/v1"

def test_api_health():
    """Test if the API is running"""
    print("[TEST] Testing API health...")
    try:
        response = requests.get(f"{API_BASE}/stats", timeout=5)
        if response.status_code == 200:
            print("[PASS] API is running and accessible")
            return True
        else:
            print(f"[FAIL] API returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("[FAIL] Cannot connect to API. Is the backend running?")
        return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def test_attendance_submission():
    """Test attendance submission flow"""
    print("\n[TEST] Testing attendance submission...")
    try:
        data = {
            "teacher_name": "Dr. Smith",
            "course": "Data Structures and Algorithms",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "year": str(datetime.now().year),
            "present_students": ["1", "2", "3", "4"]
        }
        
        response = requests.post(
            f"{API_BASE}/attendance",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("[PASS] Attendance submission successful")
                print(f"   Block index: {result.get('data', {}).get('block_index', 'N/A')}")
                return True
            else:
                print(f"[FAIL] Submission failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"[FAIL] Submission returned status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def test_record_search():
    """Test record search flow"""
    print("\n[TEST] Testing record search...")
    try:
        current_year = str(datetime.now().year)
        today = datetime.now().strftime("%Y-%m-%d")
        
        params = {
            "teacher_name": "Dr. Smith",
            "course": "Data Structures and Algorithms",
            "date": today,
            "year": current_year,
            "page": 1,
            "per_page": 10
        }
        
        response = requests.get(
            f"{API_BASE}/records",
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                records = result.get("data", {}).get("data", [])
                print(f"[PASS] Record search successful - Found {len(records)} records")
                return True
            else:
                print(f"[FAIL] Search failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"[FAIL] Search returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def test_student_search():
    """Test student search flow"""
    print("\n[TEST] Testing student search...")
    try:
        roll_no = "1"
        
        response = requests.get(
            f"{API_BASE}/students/{roll_no}",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                data = result.get("data", {})
                total_records = data.get("total_records", 0)
                print(f"[PASS] Student search successful - Found {total_records} records for roll number {roll_no}")
                return True
            else:
                print(f"[FAIL] Student search failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"[FAIL] Student search returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def test_integrity_check():
    """Test blockchain integrity check"""
    print("\n[TEST] Testing integrity check...")
    try:
        response = requests.get(f"{API_BASE}/integrity", timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                integrity_data = result.get("data", {})
                is_valid = integrity_data.get("is_valid", False)
                status = "[PASS] Valid" if is_valid else "[WARN] Invalid"
                print(f"{status} - {integrity_data.get('result', 'No result')}")
                return True
            else:
                print(f"[FAIL] Integrity check failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"[FAIL] Integrity check returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def test_analytics():
    """Test analytics endpoint"""
    print("\n[TEST] Testing analytics...")
    try:
        response = requests.get(f"{API_BASE}/analytics", timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                analytics = result.get("data", {})
                overview = analytics.get("overview", {})
                print(f"[PASS] Analytics loaded successfully")
                print(f"   Total blocks: {overview.get('total_blocks', 0)}")
                print(f"   Attendance blocks: {overview.get('attendance_blocks', 0)}")
                return True
            else:
                print(f"[FAIL] Analytics failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"[FAIL] Analytics returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def test_stats():
    """Test stats endpoint"""
    print("\n[TEST] Testing stats...")
    try:
        response = requests.get(f"{API_BASE}/stats", timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                stats = result.get("data", {})
                print(f"[PASS] Stats loaded successfully")
                print(f"   Total blocks: {stats.get('total_blocks', 0)}")
                print(f"   Attendance blocks: {stats.get('attendance_blocks', 0)}")
                return True
            else:
                print(f"[FAIL] Stats failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"[FAIL] Stats returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Phase 1: Validation and Testing")
    print("=" * 60)
    
    results = []
    
    results.append(("API Health", test_api_health()))
    results.append(("Stats", test_stats()))
    results.append(("Integrity Check", test_integrity_check()))
    results.append(("Analytics", test_analytics()))
    results.append(("Attendance Submission", test_attendance_submission()))
    results.append(("Record Search", test_record_search()))
    results.append(("Student Search", test_student_search()))
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[SUCCESS] All tests passed! Application is working correctly.")
        return 0
    else:
        print(f"\n[WARNING] {total - passed} test(s) failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

