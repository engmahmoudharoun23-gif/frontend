#!/usr/bin/env python3
"""
Governorate Permissions Testing for Arabic Review Request
Tests authentication and governorate permissions for different users
"""

import requests
import json
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class GovernoratePermissionsTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_user_login_and_governorates(self, username, password, expected_governorates, expected_count, user_level):
        """Test login and governorate permissions for a specific user"""
        print(f"\n=== Testing {username} ({user_level}) ===")
        
        try:
            # Step 1: Login
            login_data = {
                "username": username,
                "password": password
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                user_info = data.get('user', {})
                
                self.log_result(
                    f"{username} Login", 
                    True, 
                    f"Successfully logged in as {username}",
                    {"user_role": user_info.get('role'), "user_level": user_level}
                )
                
                # Step 2: Test governorates endpoint
                headers = {'Authorization': f'Bearer {token}'}
                project_name = 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط'
                
                response = requests.get(
                    f"{API_BASE}/governorates", 
                    params={'project': project_name},
                    headers=headers
                )
                
                if response.status_code == 200:
                    governorates = response.json()
                    
                    # Check governorates
                    if expected_count == "all":
                        # Should see all 9 governorates
                        success = len(governorates) == 9
                        expected_msg = "all 9 governorates"
                    else:
                        # Should see specific governorates
                        if isinstance(expected_governorates, list):
                            success = (len(governorates) == expected_count and 
                                      all(gov in expected_governorates for gov in governorates) and
                                      all(gov in governorates for gov in expected_governorates))
                        else:
                            success = len(governorates) == expected_count
                        expected_msg = f"{expected_count} governorates: {expected_governorates}"
                    
                    self.log_result(
                        f"{username} Governorates", 
                        success, 
                        f"{username} sees correct governorates: {len(governorates)} governorates",
                        {
                            "user": username,
                            "level": user_level,
                            "expected": expected_msg,
                            "actual_count": len(governorates),
                            "actual_governorates": governorates,
                            "success": success
                        }
                    )
                else:
                    self.log_result(
                        f"{username} Governorates", 
                        False, 
                        f"Failed to get governorates: {response.status_code}",
                        {"response": response.text}
                    )
                    
            else:
                self.log_result(
                    f"{username} Login", 
                    False, 
                    f"Failed to login as {username}: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                f"{username} Test", 
                False, 
                f"Error testing {username}: {str(e)}"
            )

    def run_governorate_permissions_tests(self):
        """Run all governorate permissions tests as specified in Arabic review"""
        print("🚀 Starting Governorate Permissions Testing (Arabic Review Request)")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # Test cases from Arabic review request
        test_cases = [
            {
                "username": "Mohamed Shawqi",
                "password": "123456",
                "expected_governorates": ["القصب", "شقراء", "مرات"],
                "expected_count": 3,
                "user_level": "Level 3 - 3 governorates"
            },
            {
                "username": "Eng Mahmoud Haroun",
                "password": "123456",
                "expected_governorates": "all",
                "expected_count": "all",
                "user_level": "Level 3 - all governorates"
            },
            {
                "username": "Midahat",
                "password": "123456",
                "expected_governorates": "all",
                "expected_count": "all",
                "user_level": "Level 2 - all governorates"
            },
            {
                "username": "Amr Tawfik",
                "password": "123456",
                "expected_governorates": ["عفيف"],
                "expected_count": 1,
                "user_level": "Level 3 - 1 governorate"
            }
        ]
        
        # Run tests for each user
        for test_case in test_cases:
            self.test_user_login_and_governorates(
                test_case["username"],
                test_case["password"],
                test_case["expected_governorates"],
                test_case["expected_count"],
                test_case["user_level"]
            )
        
        return self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 GOVERNORATE PERMISSIONS TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        if passed_tests > 0:
            print(f"\n✅ SUCCESSFUL TESTS:")
            for result in self.test_results:
                if result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return success_rate == 100.0

if __name__ == "__main__":
    tester = GovernoratePermissionsTester()
    success = tester.run_governorate_permissions_tests()
    
    if success:
        print("\n🎉 All governorate permissions tests passed!")
    else:
        print("\n⚠️ Some tests failed. Please check the results above.")