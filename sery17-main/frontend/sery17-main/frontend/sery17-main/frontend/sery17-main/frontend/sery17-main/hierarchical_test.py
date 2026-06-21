#!/usr/bin/env python3
"""
Hierarchical Filtering Backend Test for WFM Report Management System
Tests the hierarchical data filtering system as requested in Arabic review
"""

import requests
import json
import os
from pathlib import Path
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class HierarchicalFilteringTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.user_tokens = {}
        
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
    
    def test_user_login(self, username, expected_password="123456"):
        """Test login for a specific user"""
        print(f"\n=== Testing Login for {username} ===")
        
        login_data = {
            "username": username,
            "password": expected_password
        }
        
        try:
            response = requests.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                access_token = data.get('access_token')
                user_info = data.get('user', {})
                
                # Store token for this user
                self.user_tokens[username] = {
                    'token': access_token,
                    'user_info': user_info
                }
                
                self.log_result(
                    f"Login - {username}", 
                    True, 
                    f"Successfully logged in as {username}",
                    {
                        "user_id": user_info.get('id'),
                        "role": user_info.get('role'),
                        "full_name": user_info.get('full_name')
                    }
                )
                return True
            else:
                self.log_result(
                    f"Login - {username}", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Login - {username}", 
                False, 
                f"Login request failed: {str(e)}"
            )
            return False
    
    def test_reports_endpoint(self, username, expected_count):
        """Test GET /api/reports for a specific user"""
        print(f"\n=== Testing Reports Endpoint for {username} ===")
        
        if username not in self.user_tokens:
            self.log_result(f"Reports - {username}", False, f"No token available for {username}")
            return
        
        token = self.user_tokens[username]['token']
        headers = {'Authorization': f'Bearer {token}'}
        
        try:
            response = requests.get(f"{API_BASE}/reports", headers=headers)
            
            if response.status_code == 200:
                reports = response.json()
                
                if isinstance(reports, list):
                    actual_count = len(reports)
                    success = actual_count == expected_count
                    
                    self.log_result(
                        f"Reports - {username}", 
                        success, 
                        f"Found {actual_count} reports (expected {expected_count})",
                        {
                            "expected_count": expected_count,
                            "actual_count": actual_count,
                            "user_role": self.user_tokens[username]['user_info'].get('role'),
                            "sample_reports": [r.get('report_number') for r in reports[:3]] if reports else []
                        }
                    )
                else:
                    self.log_result(
                        f"Reports - {username}", 
                        False, 
                        "Reports response is not a list",
                        {"response_type": type(reports)}
                    )
            else:
                self.log_result(
                    f"Reports - {username}", 
                    False, 
                    f"Failed to get reports: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                f"Reports - {username}", 
                False, 
                f"Error getting reports: {str(e)}"
            )
    
    def test_reports_stats_endpoint(self, username, expected_total):
        """Test GET /api/reports/stats for a specific user"""
        print(f"\n=== Testing Reports Stats Endpoint for {username} ===")
        
        if username not in self.user_tokens:
            self.log_result(f"Reports Stats - {username}", False, f"No token available for {username}")
            return
        
        token = self.user_tokens[username]['token']
        headers = {'Authorization': f'Bearer {token}'}
        
        try:
            response = requests.get(f"{API_BASE}/reports/stats", headers=headers)
            
            if response.status_code == 200:
                stats = response.json()
                
                if isinstance(stats, dict):
                    actual_total = stats.get('total', 0)
                    success = actual_total == expected_total
                    
                    self.log_result(
                        f"Reports Stats - {username}", 
                        success, 
                        f"Stats show {actual_total} total reports (expected {expected_total})",
                        {
                            "expected_total": expected_total,
                            "actual_total": actual_total,
                            "fixed": stats.get('fixed', 0),
                            "asphalt_remaining": stats.get('asphalt_remaining', 0),
                            "user_role": self.user_tokens[username]['user_info'].get('role')
                        }
                    )
                else:
                    self.log_result(
                        f"Reports Stats - {username}", 
                        False, 
                        "Stats response is not a dict",
                        {"response_type": type(stats)}
                    )
            else:
                self.log_result(
                    f"Reports Stats - {username}", 
                    False, 
                    f"Failed to get stats: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                f"Reports Stats - {username}", 
                False, 
                f"Error getting stats: {str(e)}"
            )
    
    def test_dashboard_stats_endpoint(self, username, expected_total):
        """Test GET /api/dashboard-stats for a specific user"""
        print(f"\n=== Testing Dashboard Stats Endpoint for {username} ===")
        
        if username not in self.user_tokens:
            self.log_result(f"Dashboard Stats - {username}", False, f"No token available for {username}")
            return
        
        token = self.user_tokens[username]['token']
        headers = {'Authorization': f'Bearer {token}'}
        
        try:
            response = requests.get(f"{API_BASE}/dashboard-stats", headers=headers)
            
            if response.status_code == 200:
                stats = response.json()
                
                if isinstance(stats, dict):
                    actual_total = stats.get('total_reports', 0)
                    success = actual_total == expected_total
                    
                    self.log_result(
                        f"Dashboard Stats - {username}", 
                        success, 
                        f"Dashboard shows {actual_total} total reports (expected {expected_total})",
                        {
                            "expected_total": expected_total,
                            "actual_total": actual_total,
                            "fixed_asphalt": stats.get('fixed_asphalt', 0),
                            "fixed_dirt": stats.get('fixed_dirt', 0),
                            "fixed_tiles": stats.get('fixed_tiles', 0),
                            "user_role": self.user_tokens[username]['user_info'].get('role')
                        }
                    )
                else:
                    self.log_result(
                        f"Dashboard Stats - {username}", 
                        False, 
                        "Dashboard stats response is not a dict",
                        {"response_type": type(stats)}
                    )
            else:
                self.log_result(
                    f"Dashboard Stats - {username}", 
                    False, 
                    f"Failed to get dashboard stats: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                f"Dashboard Stats - {username}", 
                False, 
                f"Error getting dashboard stats: {str(e)}"
            )
    
    def test_user_hierarchy(self, username, expected_reports):
        """Test all endpoints for a specific user in the hierarchy"""
        print(f"\n{'='*60}")
        print(f"TESTING USER: {username} (Expected: {expected_reports} reports)")
        print(f"{'='*60}")
        
        # Test all three endpoints
        self.test_reports_endpoint(username, expected_reports)
        self.test_reports_stats_endpoint(username, expected_reports)
        self.test_dashboard_stats_endpoint(username, expected_reports)
    
    def run_hierarchical_tests(self):
        """Run all hierarchical filtering tests as specified in Arabic review"""
        print("🚀 Starting Hierarchical Filtering Backend Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        
        # Test users and their expected report counts based on hierarchy
        test_users = [
            ("admin", 82),           # Level 1 - should see all 82 reports
            ("Midahat", 82),         # Level 2 - should see 82 reports (from Mohamed Shawqi)
            ("Mohamed Shawqi", 82),  # Level 3 - should see 82 reports (his own)
            ("Amr Tawfik", 0)        # Level 3 - should see 0 reports (no reports, no subordinates)
        ]
        
        # Step 1: Test login for all users
        print("\n" + "="*80)
        print("STEP 1: TESTING LOGIN FOR ALL USERS")
        print("="*80)
        
        login_success_count = 0
        for username, _ in test_users:
            if self.test_user_login(username):
                login_success_count += 1
        
        print(f"\n📊 Login Summary: {login_success_count}/{len(test_users)} users logged in successfully")
        
        # Step 2: Test hierarchical filtering for each user
        print("\n" + "="*80)
        print("STEP 2: TESTING HIERARCHICAL FILTERING")
        print("="*80)
        
        for username, expected_reports in test_users:
            if username in self.user_tokens:
                self.test_user_hierarchy(username, expected_reports)
            else:
                print(f"\n⚠️  Skipping {username} - login failed")
        
        # Step 3: Summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("📋 COMPREHENSIVE TEST SUMMARY")
        print("="*80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Group results by category
        categories = {}
        for result in self.test_results:
            category = result['test'].split(' - ')[0]
            if category not in categories:
                categories[category] = {'passed': 0, 'failed': 0, 'tests': []}
            
            if result['success']:
                categories[category]['passed'] += 1
            else:
                categories[category]['failed'] += 1
            categories[category]['tests'].append(result)
        
        print("\n📊 Results by Category:")
        for category, data in categories.items():
            total = data['passed'] + data['failed']
            success_rate = (data['passed'] / total * 100) if total > 0 else 0
            print(f"  {category}: {data['passed']}/{total} passed ({success_rate:.1f}%)")
        
        # Show failed tests details
        failed_results = [r for r in self.test_results if not r['success']]
        if failed_results:
            print(f"\n❌ Failed Tests Details:")
            for result in failed_results:
                print(f"  • {result['test']}: {result['message']}")
                if result.get('details'):
                    print(f"    Details: {result['details']}")
        
        # Show hierarchy verification
        print(f"\n🏗️  Hierarchical Filtering Verification:")
        hierarchy_tests = [r for r in self.test_results if 'Reports -' in r['test']]
        for result in hierarchy_tests:
            username = result['test'].split(' - ')[1]
            status = "✅" if result['success'] else "❌"
            print(f"  {status} {username}: {result['message']}")
        
        print(f"\n🎯 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def main():
    """Main test execution"""
    tester = HierarchicalFilteringTester()
    tester.run_hierarchical_tests()

if __name__ == "__main__":
    main()