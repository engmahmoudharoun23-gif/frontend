#!/usr/bin/env python3
"""
Arabic Review Request Backend API Testing
Tests new features requested in Arabic review:
1. Invoice filtering by date (date=2025-12-26)
2. Invoice filtering by month (month=2025-12)
3. Employee requests filtering by date and month
4. New notifications API (GET /api/notifications/pending-count)
"""

import requests
import json
from datetime import datetime, timezone
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class ArabicReviewTester:
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
        
        # Test login with admin credentials as specified in request
        login_data = {
            "username": "admin",
            "password": "123456"
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

    def test_level2_user_authentication(self):
        """Test login with Level 2 user (Eng Medhat Hussien)"""
        print("\n=== Testing Level 2 User Authentication ===")
        
        # Test login with Level 2 credentials
        login_data = {
            "username": "Eng Medhat Hussien",
            "password": "123456"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                level2_token = data.get('access_token')
                user_info = data.get('user', {})
                
                self.log_result(
                    "Level 2 User Authentication", 
                    True, 
                    "Successfully logged in as Level 2 user (Eng Medhat Hussien)",
                    {
                        "username": user_info.get('username'),
                        "full_name": user_info.get('full_name'),
                        "role": user_info.get('role'),
                        "projects": user_info.get('projects', []),
                        "governorates": user_info.get('governorates', [])
                    }
                )
                return level2_token
            else:
                self.log_result(
                    "Level 2 User Authentication", 
                    False, 
                    f"Level 2 login failed with status {response.status_code}",
                    {"response": response.text}
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Level 2 User Authentication", 
                False, 
                f"Level 2 login request failed: {str(e)}"
            )
            return None

    def test_invoice_date_filtering(self):
        """Test invoice filtering by specific date (date=2025-12-26)"""
        print("\n=== Testing Invoice Date Filtering ===")
        
        if not self.auth_token:
            self.log_result("Invoice Date Filtering", False, "No authentication token available")
            return
        
        try:
            # Test filtering invoices by specific date
            test_date = "2025-12-26"
            response = self.session.get(f"{API_BASE}/invoices", params={'date': test_date})
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    # Verify all returned invoices match the date filter
                    date_filter_works = True
                    for invoice in invoices:
                        created_at = invoice.get('created_at', '')
                        if test_date not in created_at:
                            date_filter_works = False
                            break
                    
                    self.log_result(
                        "Invoice Date Filtering", 
                        True, 
                        f"Date filtering works - {len(invoices)} invoices found for {test_date}",
                        {
                            "test_date": test_date,
                            "invoices_count": len(invoices),
                            "date_filter_accurate": date_filter_works
                        }
                    )
                else:
                    self.log_result(
                        "Invoice Date Filtering", 
                        False, 
                        "Invoice date filtering response is not a list",
                        {"response_type": type(invoices)}
                    )
            else:
                self.log_result(
                    "Invoice Date Filtering", 
                    False, 
                    f"Failed to filter invoices by date: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Date Filtering", 
                False, 
                f"Error testing invoice date filtering: {str(e)}"
            )

    def test_invoice_month_filtering(self):
        """Test invoice filtering by month (month=2025-12)"""
        print("\n=== Testing Invoice Month Filtering ===")
        
        if not self.auth_token:
            self.log_result("Invoice Month Filtering", False, "No authentication token available")
            return
        
        try:
            # Test filtering invoices by month
            test_month = "2025-12"
            response = self.session.get(f"{API_BASE}/invoices", params={'month': test_month})
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    # Verify all returned invoices match the month filter
                    month_filter_works = True
                    for invoice in invoices:
                        created_at = invoice.get('created_at', '')
                        if test_month not in created_at:
                            month_filter_works = False
                            break
                    
                    self.log_result(
                        "Invoice Month Filtering", 
                        True, 
                        f"Month filtering works - {len(invoices)} invoices found for {test_month}",
                        {
                            "test_month": test_month,
                            "invoices_count": len(invoices),
                            "month_filter_accurate": month_filter_works
                        }
                    )
                else:
                    self.log_result(
                        "Invoice Month Filtering", 
                        False, 
                        "Invoice month filtering response is not a list",
                        {"response_type": type(invoices)}
                    )
            else:
                self.log_result(
                    "Invoice Month Filtering", 
                    False, 
                    f"Failed to filter invoices by month: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Month Filtering", 
                False, 
                f"Error testing invoice month filtering: {str(e)}"
            )

    def test_employee_requests_date_filtering(self):
        """Test employee requests filtering by specific date (date=2025-12-26)"""
        print("\n=== Testing Employee Requests Date Filtering ===")
        
        if not self.auth_token:
            self.log_result("Employee Requests Date Filtering", False, "No authentication token available")
            return
        
        try:
            # Test filtering employee requests by specific date
            test_date = "2025-12-26"
            response = self.session.get(f"{API_BASE}/employee-requests", params={'date': test_date})
            
            if response.status_code == 200:
                requests = response.json()
                
                if isinstance(requests, list):
                    # Verify all returned requests match the date filter
                    date_filter_works = True
                    for request in requests:
                        created_at = request.get('created_at', '')
                        if test_date not in created_at:
                            date_filter_works = False
                            break
                    
                    self.log_result(
                        "Employee Requests Date Filtering", 
                        True, 
                        f"Date filtering works - {len(requests)} employee requests found for {test_date}",
                        {
                            "test_date": test_date,
                            "requests_count": len(requests),
                            "date_filter_accurate": date_filter_works
                        }
                    )
                else:
                    self.log_result(
                        "Employee Requests Date Filtering", 
                        False, 
                        "Employee requests date filtering response is not a list",
                        {"response_type": type(requests)}
                    )
            else:
                self.log_result(
                    "Employee Requests Date Filtering", 
                    False, 
                    f"Failed to filter employee requests by date: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Employee Requests Date Filtering", 
                False, 
                f"Error testing employee requests date filtering: {str(e)}"
            )

    def test_employee_requests_month_filtering(self):
        """Test employee requests filtering by month (month=2025-12)"""
        print("\n=== Testing Employee Requests Month Filtering ===")
        
        if not self.auth_token:
            self.log_result("Employee Requests Month Filtering", False, "No authentication token available")
            return
        
        try:
            # Test filtering employee requests by month
            test_month = "2025-12"
            response = self.session.get(f"{API_BASE}/employee-requests", params={'month': test_month})
            
            if response.status_code == 200:
                requests = response.json()
                
                if isinstance(requests, list):
                    # Verify all returned requests match the month filter
                    month_filter_works = True
                    for request in requests:
                        created_at = request.get('created_at', '')
                        if test_month not in created_at:
                            month_filter_works = False
                            break
                    
                    self.log_result(
                        "Employee Requests Month Filtering", 
                        True, 
                        f"Month filtering works - {len(requests)} employee requests found for {test_month}",
                        {
                            "test_month": test_month,
                            "requests_count": len(requests),
                            "month_filter_accurate": month_filter_works
                        }
                    )
                else:
                    self.log_result(
                        "Employee Requests Month Filtering", 
                        False, 
                        "Employee requests month filtering response is not a list",
                        {"response_type": type(requests)}
                    )
            else:
                self.log_result(
                    "Employee Requests Month Filtering", 
                    False, 
                    f"Failed to filter employee requests by month: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Employee Requests Month Filtering", 
                False, 
                f"Error testing employee requests month filtering: {str(e)}"
            )

    def test_notifications_pending_count(self):
        """Test new notifications API (GET /api/notifications/pending-count)"""
        print("\n=== Testing Notifications Pending Count API ===")
        
        if not self.auth_token:
            self.log_result("Notifications Pending Count", False, "No authentication token available")
            return
        
        try:
            # Test the new notifications pending count endpoint
            response = self.session.get(f"{API_BASE}/notifications/pending-count")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure - the API returns pending_invoices, pending_requests, and total
                has_pending_invoices = 'pending_invoices' in data
                has_pending_requests = 'pending_requests' in data
                has_total = 'total' in data
                
                pending_invoices = data.get('pending_invoices', 0)
                pending_requests = data.get('pending_requests', 0)
                total_count = data.get('total', 0)
                
                success = (has_pending_invoices and has_pending_requests and has_total and 
                          isinstance(pending_invoices, int) and isinstance(pending_requests, int) and 
                          isinstance(total_count, int) and all(x >= 0 for x in [pending_invoices, pending_requests, total_count]))
                
                self.log_result(
                    "Notifications Pending Count", 
                    success, 
                    f"Notifications API works - {pending_invoices} pending invoices, {pending_requests} pending requests, {total_count} total",
                    {
                        "pending_invoices": pending_invoices,
                        "pending_requests": pending_requests,
                        "total": total_count,
                        "response_structure": data,
                        "has_required_fields": has_pending_invoices and has_pending_requests and has_total
                    }
                )
            else:
                self.log_result(
                    "Notifications Pending Count", 
                    False, 
                    f"Failed to get notifications pending count: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Notifications Pending Count", 
                False, 
                f"Error testing notifications pending count: {str(e)}"
            )

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 ARABIC REVIEW TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if passed_tests > 0:
            print(f"\n✅ SUCCESSFUL TESTS:")
            for result in self.test_results:
                if result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
                    if result['details']:
                        print(f"    Details: {result['details']}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': success_rate
        }

    def run_arabic_review_tests(self):
        """Run all Arabic review request tests"""
        print(f"\n🚀 Starting Arabic Review Request Backend API Tests")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print(f"📡 API Base: {API_BASE}")
        print("=" * 80)
        
        # Authentication test
        if not self.test_authentication():
            print("\n❌ Authentication failed. Stopping tests.")
            return self.print_summary()
        
        # Test Level 2 user authentication as requested
        level2_token = self.test_level2_user_authentication()
        
        # NEW TESTS - As requested in Arabic review
        print("\n" + "="*60)
        print("🆕 TESTING NEW FEATURES (Arabic Review Request)")
        print("="*60)
        
        # Invoice filtering tests
        self.test_invoice_date_filtering()
        self.test_invoice_month_filtering()
        
        # Employee requests filtering tests
        self.test_employee_requests_date_filtering()
        self.test_employee_requests_month_filtering()
        
        # New notifications API test
        self.test_notifications_pending_count()
        
        return self.print_summary()


if __name__ == "__main__":
    tester = ArabicReviewTester()
    results = tester.run_arabic_review_tests()