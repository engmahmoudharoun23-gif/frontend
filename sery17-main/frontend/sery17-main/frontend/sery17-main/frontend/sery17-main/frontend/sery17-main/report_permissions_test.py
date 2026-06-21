#!/usr/bin/env python3
"""
Report Permissions Testing for WFM Report Management System
Tests the report permissions fix as requested in Arabic review
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

class ReportPermissionsTester:
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

    def test_admin_user_permissions(self):
        """Test Admin User - should see all reports (approximately 266 reports)"""
        print("\n=== Testing Report Permissions - Admin User ===")
        
        try:
            # Login as admin
            login_data = {"username": "admin", "password": "123456"}
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                admin_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {admin_token}'})
                
                # Test GET /api/reports - should see all reports
                response = self.session.get(f"{API_BASE}/reports?page=1&limit=10")
                
                if response.status_code == 200:
                    reports_data = response.json()
                    total_count = reports_data.get('total_count', 0)
                    reports = reports_data.get('reports', [])
                    
                    # Admin should see all reports (around 266)
                    success = total_count > 200  # Expecting around 266 reports
                    
                    self.log_result(
                        "Admin User Permissions", 
                        success, 
                        f"Admin sees {total_count} reports (expected ~266)",
                        {
                            "total_count": total_count,
                            "page_reports": len(reports),
                            "user_role": "admin",
                            "expected_range": "~266 reports"
                        }
                    )
                else:
                    self.log_result(
                        "Admin User Permissions", 
                        False, 
                        f"Failed to get reports as admin: {response.status_code}",
                        {"response": response.text}
                    )
            else:
                self.log_result(
                    "Admin User Permissions", 
                    False, 
                    f"Failed to login as admin: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Admin User Permissions", 
                False, 
                f"Error testing admin permissions: {str(e)}"
            )

    def test_elshazly_user_permissions(self):
        """Test Restricted User (ElShazly) - should see only their reports (around 81 reports)"""
        print("\n=== Testing Report Permissions - Restricted User (ElShazly) ===")
        
        try:
            # Login as ElShazly
            login_data = {"username": "ElShazly", "password": "123456"}
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                elshazly_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {elshazly_token}'})
                
                # Test GET /api/reports - should see only their reports
                response = self.session.get(f"{API_BASE}/reports?page=1&limit=10")
                
                if response.status_code == 200:
                    reports_data = response.json()
                    total_count = reports_data.get('total_count', 0)
                    reports = reports_data.get('reports', [])
                    
                    # ElShazly should see only their reports (around 81)
                    success = 70 <= total_count <= 90  # Expected around 81 reports
                    
                    # Verify all reports are created by ElShazly
                    all_by_elshazly = True
                    for report in reports:
                        created_by_name = report.get('created_by_name', '')
                        if 'ElShazly' not in created_by_name and 'الشاذلي' not in created_by_name:
                            all_by_elshazly = False
                            break
                    
                    final_success = success and all_by_elshazly
                    
                    self.log_result(
                        "ElShazly User Permissions", 
                        final_success, 
                        f"ElShazly sees {total_count} reports (expected ~81, all their own)",
                        {
                            "total_count": total_count,
                            "page_reports": len(reports),
                            "user": "ElShazly",
                            "expected_range": "70-90 reports",
                            "all_by_elshazly": all_by_elshazly,
                            "sample_creators": [r.get('created_by_name') for r in reports[:3]]
                        }
                    )
                else:
                    self.log_result(
                        "ElShazly User Permissions", 
                        False, 
                        f"Failed to get reports as ElShazly: {response.status_code}",
                        {"response": response.text}
                    )
            else:
                self.log_result(
                    "ElShazly User Permissions", 
                    False, 
                    f"Failed to login as ElShazly: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "ElShazly User Permissions", 
                False, 
                f"Error testing ElShazly permissions: {str(e)}"
            )

    def test_mahmoud_haroun_permissions(self):
        """Test Reviewer (Eng Mahmoud Haroun) - should see all reports in their scope (around 264 reports)"""
        print("\n=== Testing Report Permissions - Reviewer (Eng Mahmoud Haroun) ===")
        
        try:
            # Login as Eng Mahmoud Haroun
            login_data = {"username": "Eng Mahmoud Haroun", "password": "123456"}
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                mahmoud_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {mahmoud_token}'})
                
                # Test GET /api/reports - should see all reports in their scope
                response = self.session.get(f"{API_BASE}/reports?page=1&limit=10")
                
                if response.status_code == 200:
                    reports_data = response.json()
                    total_count = reports_data.get('total_count', 0)
                    reports = reports_data.get('reports', [])
                    
                    # Mahmoud should see reports in his scope (around 264)
                    success = total_count > 250  # Expected around 264 reports
                    
                    # Check if he can see ElShazly's reports and others
                    creators = [r.get('created_by_name', '') for r in reports]
                    has_elshazly_reports = any('ElShazly' in creator or 'الشاذلي' in creator for creator in creators)
                    
                    self.log_result(
                        "Mahmoud Haroun Permissions", 
                        success, 
                        f"Mahmoud Haroun sees {total_count} reports (expected ~264)",
                        {
                            "total_count": total_count,
                            "page_reports": len(reports),
                            "user": "Eng Mahmoud Haroun",
                            "expected_range": "~264 reports",
                            "has_elshazly_reports": has_elshazly_reports,
                            "sample_creators": list(set(creators))[:5]
                        }
                    )
                else:
                    self.log_result(
                        "Mahmoud Haroun Permissions", 
                        False, 
                        f"Failed to get reports as Mahmoud Haroun: {response.status_code}",
                        {"response": response.text}
                    )
            else:
                self.log_result(
                    "Mahmoud Haroun Permissions", 
                    False, 
                    f"Failed to login as Mahmoud Haroun: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Mahmoud Haroun Permissions", 
                False, 
                f"Error testing Mahmoud Haroun permissions: {str(e)}"
            )

    def test_my_reports_filter_admin(self):
        """Test 'My Reports' filter with Admin user"""
        print("\n=== Testing 'My Reports' Filter - Admin User ===")
        
        try:
            # Login as admin
            login_data = {"username": "admin", "password": "123456"}
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                admin_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {admin_token}'})
                
                # Test without my_reports filter (should see all)
                response_all = self.session.get(f"{API_BASE}/reports?page=1&limit=10")
                
                # Test with my_reports=true (should see only admin's reports)
                response_my = self.session.get(f"{API_BASE}/reports?page=1&limit=10&my_reports=true")
                
                if response_all.status_code == 200 and response_my.status_code == 200:
                    all_data = response_all.json()
                    my_data = response_my.json()
                    
                    all_count = all_data.get('total_count', 0)
                    my_count = my_data.get('total_count', 0)
                    
                    # My reports should be less than or equal to all reports
                    success = my_count <= all_count and my_count >= 0
                    
                    # Verify all reports in my_reports are created by admin
                    my_reports = my_data.get('reports', [])
                    all_by_admin = True
                    for report in my_reports:
                        created_by_name = report.get('created_by_name', '')
                        if 'admin' not in created_by_name.lower() and 'مسؤول' not in created_by_name:
                            all_by_admin = False
                            break
                    
                    final_success = success and (my_count == 0 or all_by_admin)
                    
                    self.log_result(
                        "My Reports Filter (Admin)", 
                        final_success, 
                        f"Admin: All reports={all_count}, My reports={my_count}",
                        {
                            "all_reports_count": all_count,
                            "my_reports_count": my_count,
                            "user": "admin",
                            "all_by_admin": all_by_admin,
                            "sample_my_creators": [r.get('created_by_name') for r in my_reports[:3]]
                        }
                    )
                else:
                    self.log_result(
                        "My Reports Filter (Admin)", 
                        False, 
                        f"Failed to test my_reports filter: all={response_all.status_code}, my={response_my.status_code}",
                        {"all_response": response_all.text, "my_response": response_my.text}
                    )
            else:
                self.log_result(
                    "My Reports Filter (Admin)", 
                    False, 
                    f"Failed to login as admin: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "My Reports Filter (Admin)", 
                False, 
                f"Error testing my_reports filter for admin: {str(e)}"
            )

    def test_my_reports_filter_mahmoud(self):
        """Test 'My Reports' filter with Mahmoud Haroun user"""
        print("\n=== Testing 'My Reports' Filter - Mahmoud Haroun ===")
        
        try:
            # Login as Mahmoud Haroun
            login_data = {"username": "Eng Mahmoud Haroun", "password": "123456"}
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                mahmoud_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {mahmoud_token}'})
                
                # Test without my_reports filter (should see all in scope)
                response_all = self.session.get(f"{API_BASE}/reports?page=1&limit=10")
                
                # Test with my_reports=true (should see only Mahmoud's reports)
                response_my = self.session.get(f"{API_BASE}/reports?page=1&limit=10&my_reports=true")
                
                if response_all.status_code == 200 and response_my.status_code == 200:
                    all_data = response_all.json()
                    my_data = response_my.json()
                    
                    all_count = all_data.get('total_count', 0)
                    my_count = my_data.get('total_count', 0)
                    
                    # My reports should be less than or equal to all reports
                    success = my_count <= all_count and my_count >= 0
                    
                    # Verify all reports in my_reports are created by Mahmoud
                    my_reports = my_data.get('reports', [])
                    all_by_mahmoud = True
                    for report in my_reports:
                        created_by_name = report.get('created_by_name', '')
                        if 'Mahmoud' not in created_by_name and 'محمود' not in created_by_name:
                            all_by_mahmoud = False
                            break
                    
                    final_success = success and (my_count == 0 or all_by_mahmoud)
                    
                    self.log_result(
                        "My Reports Filter (Mahmoud)", 
                        final_success, 
                        f"Mahmoud: All reports={all_count}, My reports={my_count}",
                        {
                            "all_reports_count": all_count,
                            "my_reports_count": my_count,
                            "user": "Eng Mahmoud Haroun",
                            "all_by_mahmoud": all_by_mahmoud,
                            "sample_my_creators": [r.get('created_by_name') for r in my_reports[:3]]
                        }
                    )
                else:
                    self.log_result(
                        "My Reports Filter (Mahmoud)", 
                        False, 
                        f"Failed to test my_reports filter: all={response_all.status_code}, my={response_my.status_code}",
                        {"all_response": response_all.text, "my_response": response_my.text}
                    )
            else:
                self.log_result(
                    "My Reports Filter (Mahmoud)", 
                    False, 
                    f"Failed to login as Mahmoud Haroun: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "My Reports Filter (Mahmoud)", 
                False, 
                f"Error testing my_reports filter for Mahmoud: {str(e)}"
            )

    def test_created_by_name_display(self):
        """Test that created_by_name is displayed correctly in reports"""
        print("\n=== Testing created_by_name Display ===")
        
        try:
            # Login as admin to see all reports
            login_data = {"username": "admin", "password": "123456"}
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                admin_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {admin_token}'})
                
                # Get reports and check created_by_name field
                response = self.session.get(f"{API_BASE}/reports?page=1&limit=20")
                
                if response.status_code == 200:
                    reports_data = response.json()
                    reports = reports_data.get('reports', [])
                    
                    # Check if created_by_name is present and not empty
                    has_created_by_name = True
                    sample_names = []
                    
                    for report in reports:
                        created_by_name = report.get('created_by_name')
                        if not created_by_name or created_by_name == 'غير معروف':
                            has_created_by_name = False
                        else:
                            sample_names.append(created_by_name)
                    
                    # Get unique names
                    unique_names = list(set(sample_names))
                    
                    self.log_result(
                        "created_by_name Display", 
                        has_created_by_name, 
                        f"created_by_name field displayed correctly in {len(reports)} reports",
                        {
                            "reports_checked": len(reports),
                            "has_created_by_name": has_created_by_name,
                            "unique_creator_names": unique_names[:10],  # Show first 10 unique names
                            "total_unique_creators": len(unique_names)
                        }
                    )
                else:
                    self.log_result(
                        "created_by_name Display", 
                        False, 
                        f"Failed to get reports: {response.status_code}",
                        {"response": response.text}
                    )
            else:
                self.log_result(
                    "created_by_name Display", 
                    False, 
                    f"Failed to login as admin: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "created_by_name Display", 
                False, 
                f"Error testing created_by_name display: {str(e)}"
            )

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 REPORT PERMISSIONS TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
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

    def run_all_tests(self):
        """Run all report permissions tests"""
        print("🚀 Starting Report Permissions Testing (Arabic Review Request)")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Run all report permissions tests
        self.test_admin_user_permissions()
        self.test_elshazly_user_permissions()
        self.test_mahmoud_haroun_permissions()
        self.test_my_reports_filter_admin()
        self.test_my_reports_filter_mahmoud()
        self.test_created_by_name_display()
        
        # Print summary
        self.print_summary()

if __name__ == "__main__":
    tester = ReportPermissionsTester()
    tester.run_all_tests()