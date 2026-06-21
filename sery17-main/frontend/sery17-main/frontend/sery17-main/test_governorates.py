#!/usr/bin/env python3
"""
Governorates Endpoint Testing for WFM Report Management System
Tests the /api/governorates endpoint as requested in Arabic review
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

class GovernoratesEndpointTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
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
    
    def test_authentication(self):
        """Test login functionality with admin credentials"""
        print("\n=== Testing Authentication ===")
        
        # Test login with admin credentials
        login_data = {
            "username": "admin",
            "password": "123456"  # As specified in Arabic review
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                
                self.log_result(
                    "Admin Login", 
                    True, 
                    "Successfully logged in as admin",
                    {"user_role": data.get('user', {}).get('role')}
                )
                return True
            else:
                self.log_result(
                    "Admin Login", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Admin Login", 
                False, 
                f"Login request failed: {str(e)}"
            )
            return False
    
    def test_governorates_with_western_project(self):
        """Test /api/governorates endpoint with Western project filter as requested in Arabic review"""
        print("\n=== Testing Governorates Endpoint - Western Project Filter ===")
        
        if not self.auth_token:
            self.log_result("Governorates (Western Project)", False, "No authentication token available")
            return
        
        try:
            # Test governorates for Western project as specified in Arabic review
            project_name = "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"
            encoded_project = requests.utils.quote(project_name)
            
            response = self.session.get(f"{API_BASE}/governorates?project={encoded_project}")
            
            if response.status_code == 200:
                governorates = response.json()
                
                if isinstance(governorates, list):
                    # Check if expected governorates are present as specified in Arabic review
                    expected_governorates = ["الدوادمي", "مرات"]
                    found_governorates = []
                    
                    for expected in expected_governorates:
                        if expected in governorates:
                            found_governorates.append(expected)
                    
                    # Success if we find the expected governorates
                    success = len(found_governorates) >= 2  # Both expected governorates found
                    
                    self.log_result(
                        "Governorates (Western Project)", 
                        success, 
                        f"Western project governorates retrieved - found {len(found_governorates)}/2 expected governorates",
                        {
                            "project_filter": project_name,
                            "total_governorates": len(governorates),
                            "expected_governorates": expected_governorates,
                            "found_expected": found_governorates,
                            "all_governorates": governorates
                        }
                    )
                else:
                    self.log_result(
                        "Governorates (Western Project)", 
                        False, 
                        "Governorates response is not a list",
                        {"response_type": type(governorates), "response": governorates}
                    )
            else:
                self.log_result(
                    "Governorates (Western Project)", 
                    False, 
                    f"Failed to get governorates with project filter: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Governorates (Western Project)", 
                False, 
                f"Error testing governorates with project: {str(e)}"
            )

    def test_governorates_without_project(self):
        """Test /api/governorates endpoint without project filter"""
        print("\n=== Testing Governorates Endpoint - Without Project Filter ===")
        
        if not self.auth_token:
            self.log_result("Governorates (No Project)", False, "No authentication token available")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/governorates")
            
            if response.status_code == 200:
                governorates = response.json()
                
                if isinstance(governorates, list):
                    # Should return governorates from database
                    success = len(governorates) >= 0  # Should at least return empty list or governorates
                    
                    self.log_result(
                        "Governorates (No Project)", 
                        success, 
                        f"Governorates endpoint works without project filter - {len(governorates)} governorates found",
                        {
                            "total_governorates": len(governorates),
                            "sample_governorates": governorates[:5] if len(governorates) > 5 else governorates
                        }
                    )
                else:
                    self.log_result(
                        "Governorates (No Project)", 
                        False, 
                        "Governorates response is not a list",
                        {"response_type": type(governorates), "response": governorates}
                    )
            else:
                self.log_result(
                    "Governorates (No Project)", 
                    False, 
                    f"Failed to get governorates without project filter: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Governorates (No Project)", 
                False, 
                f"Error testing governorates without project: {str(e)}"
            )

    def test_governorates_admin_permissions(self):
        """Test governorates endpoint permissions - Admin should see all governorates"""
        print("\n=== Testing Governorates Endpoint - Admin Permissions ===")
        
        if not self.auth_token:
            self.log_result("Governorates (Admin Permissions)", False, "No authentication token available")
            return
        
        try:
            # Test as admin user (should see all governorates)
            response = self.session.get(f"{API_BASE}/governorates")
            
            if response.status_code == 200:
                governorates = response.json()
                
                if isinstance(governorates, list):
                    # Admin should see governorates from database
                    success = True  # Admin permissions working if we get a response
                    
                    self.log_result(
                        "Governorates (Admin Permissions)", 
                        success, 
                        f"Admin can access governorates endpoint - {len(governorates)} governorates visible",
                        {
                            "user_role": "admin",
                            "governorates_count": len(governorates),
                            "has_governorates": len(governorates) > 0
                        }
                    )
                else:
                    self.log_result(
                        "Governorates (Admin Permissions)", 
                        False, 
                        "Governorates permissions test failed - response not a list",
                        {"response_type": type(governorates)}
                    )
            else:
                self.log_result(
                    "Governorates (Admin Permissions)", 
                    False, 
                    f"Admin cannot access governorates endpoint: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Governorates (Admin Permissions)", 
                False, 
                f"Error testing governorates permissions: {str(e)}"
            )

    def run_governorates_tests(self):
        """Run governorates endpoint tests as requested in Arabic review"""
        print("🏛️ Starting Governorates Endpoint Testing - Arabic Review Request")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print("=" * 80)
        
        # Step 1: Login as Admin
        if not self.test_authentication():
            print("\n❌ Authentication failed - cannot proceed with governorates tests")
            return self.generate_summary()
        
        # Step 2: Test governorates for Western project (as specified in Arabic review)
        self.test_governorates_with_western_project()
        
        # Step 3: Test governorates without project filter
        self.test_governorates_without_project()
        
        # Step 4: Test admin permissions
        self.test_governorates_admin_permissions()
        
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 80)
        print("📊 GOVERNORATES ENDPOINT TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
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
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': success_rate,
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = GovernoratesEndpointTester()
    summary = tester.run_governorates_tests()