#!/usr/bin/env python3
"""
Backend API Testing for Arabic Reports Management System - Review Request
Tests the three specific fixes requested in the review
"""

import requests
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class ReviewTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.mahmoud_token = None
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

    def test_admin_login(self):
        """Test admin login with credentials from review request"""
        print("\n=== Testing Admin Login ===")
        
        try:
            login_data = {
                "username": "admin",
                "password": "123456"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                
                self.log_result(
                    "Admin Login", 
                    True, 
                    "Successfully logged in as admin with password 123456",
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

    def test_notification_bell_filter(self):
        """Test notification bell filter for pending review reports in الدوادمي"""
        print("\n=== Testing Notification Bell - Pending Review Filter ===")
        
        if not self.auth_token:
            self.log_result("Notification Bell Filter", False, "No authentication token available")
            return
        
        try:
            # Test the specific endpoint mentioned in review request
            params = {
                'governorate': 'الدوادمي',
                'license_status': 'review_pending'
            }
            
            response = self.session.get(f"{API_BASE}/reports", params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                # Handle both list and paginated response formats
                if isinstance(data, dict) and 'reports' in data:
                    reports = data['reports']
                    total_count = data.get('total_count', len(reports))
                elif isinstance(data, list):
                    reports = data
                    total_count = len(reports)
                else:
                    reports = []
                    total_count = 0
                
                # Verify all reports are from الدوادمي and have pending review status
                all_correct_governorate = True
                all_pending_review = True
                
                for report in reports:
                    if report.get('governorate') != 'الدوادمي':
                        all_correct_governorate = False
                    if report.get('review_status') != 'بانتظار المراجعة':
                        all_pending_review = False
                
                success = all_correct_governorate and all_pending_review
                
                self.log_result(
                    "Notification Bell Filter", 
                    success, 
                    f"Filter working correctly - found {len(reports)} pending review reports in الدوادمي",
                    {
                        "reports_count": len(reports),
                        "total_count": total_count,
                        "all_correct_governorate": all_correct_governorate,
                        "all_pending_review": all_pending_review,
                        "sample_reports": [
                            {
                                "id": r.get('id'),
                                "governorate": r.get('governorate'),
                                "review_status": r.get('review_status'),
                                "report_number": r.get('report_number')
                            } for r in reports[:3]
                        ]
                    }
                )
            else:
                self.log_result(
                    "Notification Bell Filter", 
                    False, 
                    f"Failed to get filtered reports: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Notification Bell Filter", 
                False, 
                f"Error testing notification bell filter: {str(e)}"
            )

    def test_eng_mahmoud_haroun_login(self):
        """Test login as Eng Mahmoud Haroun"""
        print("\n=== Testing Eng Mahmoud Haroun Login ===")
        
        try:
            login_data = {
                "username": "Eng Mahmoud Haroun",
                "password": "123456"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                user_data = data.get('user', {})
                
                # Store the token for support messages test
                self.mahmoud_token = data.get('access_token')
                
                success = (user_data.get('username') == "Eng Mahmoud Haroun" and 
                          self.mahmoud_token is not None)
                
                self.log_result(
                    "Eng Mahmoud Haroun Login", 
                    success, 
                    "Successfully logged in as Eng Mahmoud Haroun",
                    {
                        "username": user_data.get('username'),
                        "full_name": user_data.get('full_name'),
                        "role": user_data.get('role'),
                        "has_token": self.mahmoud_token is not None
                    }
                )
                return success
            else:
                self.log_result(
                    "Eng Mahmoud Haroun Login", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Eng Mahmoud Haroun Login", 
                False, 
                f"Login request failed: {str(e)}"
            )
            return False

    def test_support_messages_access(self):
        """Test that Eng Mahmoud Haroun can access support messages"""
        print("\n=== Testing Support Messages Access ===")
        
        if not self.mahmoud_token:
            self.log_result("Support Messages Access", False, "No Eng Mahmoud Haroun token available")
            return
        
        try:
            # Create a temporary session with Mahmoud's token
            temp_session = requests.Session()
            temp_session.headers.update({'Authorization': f'Bearer {self.mahmoud_token}'})
            
            # Test GET /api/support/messages
            response = temp_session.get(f"{API_BASE}/support/messages")
            
            if response.status_code == 200:
                messages = response.json()
                
                success = isinstance(messages, list)
                
                self.log_result(
                    "Support Messages Access", 
                    success, 
                    f"Eng Mahmoud Haroun can access support messages - found {len(messages)} messages",
                    {
                        "messages_count": len(messages),
                        "response_type": type(messages).__name__,
                        "sample_message_fields": list(messages[0].keys()) if messages else []
                    }
                )
            else:
                self.log_result(
                    "Support Messages Access", 
                    False, 
                    f"Failed to access support messages: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Support Messages Access", 
                False, 
                f"Error testing support messages access: {str(e)}"
            )

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("📊 REVIEW TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in self.test_results if r['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        # Failed tests details
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        # Successful tests
        successful_tests = [r for r in self.test_results if r['success']]
        if successful_tests:
            print(f"\n✅ SUCCESSFUL TESTS:")
            for test in successful_tests:
                print(f"  - {test['test']}: {test['message']}")

    def run_tests(self):
        """Run all review tests"""
        print("🚀 Starting Arabic Reports Management System Review Tests...")
        print(f"Backend URL: {API_BASE}")
        print("=" * 60)
        
        # Test 1: Admin login
        if not self.test_admin_login():
            print("\n❌ Admin authentication failed - skipping admin tests")
        else:
            # Test 2: Notification Bell Filter
            self.test_notification_bell_filter()
        
        # Test 3: Eng Mahmoud Haroun login and support messages access
        if self.test_eng_mahmoud_haroun_login():
            self.test_support_messages_access()
        
        self.print_summary()
        return self.test_results


if __name__ == "__main__":
    tester = ReviewTester()
    tester.run_tests()