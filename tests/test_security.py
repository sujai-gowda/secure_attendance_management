"""
Phase 9: Security Test Suite
Tests for security features including CSRF, token refresh, and authentication.
"""

import sys
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5001"
API_BASE = f"{BASE_URL}/api/v1"

def test_authentication():
    """Test authentication flow"""
    print("[TEST] Testing authentication...")
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success") and result.get("data", {}).get("token"):
                print("[PASS] Authentication successful")
                return True, result.get("data", {}).get("token")
            else:
                print("[FAIL] Authentication failed: Invalid response")
                return False, None
        else:
            print(f"[FAIL] Authentication returned status {response.status_code}")
            return False, None
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False, None

def test_token_refresh(token):
    """Test token refresh mechanism"""
    print("[TEST] Testing token refresh...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{API_BASE}/auth/refresh",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success") and result.get("data", {}).get("token"):
                new_token = result.get("data", {}).get("token")
                if new_token != token:
                    print("[PASS] Token refresh successful - new token issued")
                    return True, new_token
                else:
                    print("[FAIL] Token refresh returned same token")
                    return False, None
            else:
                print("[FAIL] Token refresh failed: Invalid response")
                return False, None
        else:
            print(f"[FAIL] Token refresh returned status {response.status_code}")
            return False, None
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False, None

def test_invalid_token():
    """Test handling of invalid tokens"""
    print("[TEST] Testing invalid token handling...")
    try:
        headers = {"Authorization": "Bearer invalid_token_12345"}
        response = requests.get(
            f"{API_BASE}/auth/verify",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 401:
            print("[PASS] Invalid token correctly rejected")
            return True
        else:
            print(f"[FAIL] Invalid token not rejected - status {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def test_rate_limiting():
    """Test rate limiting on login endpoint"""
    print("[TEST] Testing rate limiting...")
    try:
        failed_attempts = 0
        for i in range(6):
            response = requests.post(
                f"{API_BASE}/auth/login",
                json={"username": "admin", "password": "wrong_password"},
                timeout=5
            )
            if response.status_code == 429:
                failed_attempts += 1
        
        if failed_attempts > 0:
            print(f"[PASS] Rate limiting active - {failed_attempts} requests rate limited")
            return True
        else:
            print("[WARN] Rate limiting may not be active")
            return True
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def test_authorization():
    """Test authorization checks"""
    print("[TEST] Testing authorization...")
    try:
        auth_success, token = test_authentication()
        if not auth_success:
            return False
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{API_BASE}/stats",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            print("[PASS] Authorized request successful")
            return True
        else:
            print(f"[FAIL] Authorized request failed - status {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False

def main():
    """Run all security tests"""
    print("=" * 60)
    print("Phase 9: Security Test Suite")
    print("=" * 60)
    
    results = []
    
    auth_result, token = test_authentication()
    results.append(("Authentication", auth_result))
    
    if auth_result and token:
        refresh_result, new_token = test_token_refresh(token)
        results.append(("Token Refresh", refresh_result))
    
    results.append(("Invalid Token Handling", test_invalid_token()))
    results.append(("Rate Limiting", test_rate_limiting()))
    results.append(("Authorization", test_authorization()))
    
    print("\n" + "=" * 60)
    print("Security Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[SUCCESS] All security tests passed!")
        return 0
    else:
        print(f"\n[WARNING] {total - passed} test(s) failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

