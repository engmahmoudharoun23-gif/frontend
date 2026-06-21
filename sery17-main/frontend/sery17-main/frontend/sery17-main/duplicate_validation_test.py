#!/usr/bin/env python3
"""
Comprehensive Duplicate Validation Testing for WFM Report Management System
Tests duplicate data validation for report_number and license_number fields
As requested in Arabic review request
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

class DuplicateValidationTester:
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
    
    def authenticate(self):
        """Test login functionality with admin credentials"""
        print("\n=== Authenticating ===")
        
        # Try different admin passwords
        passwords = ["admin123", "admin", "password", "123456", "admin@123"]
        
        for pwd in passwords:
            login_data = {
                "username": "admin",
                "password": pwd
            }
            
            try:
                response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                
                if response.status_code == 200:
                    data = response.json()
                    self.auth_token = data.get('access_token')
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    
                    print(f"✅ Successfully logged in with password: {pwd}")
                    return True
                    
            except Exception as e:
                continue
        
        print("❌ Failed to authenticate with any password")
        return False

    def test_duplicate_report_number_creation(self):
        """Test 1: محاولة إنشاء بلاغين بنفس رقم البلاغ (يجب أن يفشل الثاني)"""
        print("\n=== Test 1: Duplicate Report Number - Creation ===")
        
        if not self.auth_token:
            self.log_result("Test 1", False, "No authentication token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            report_number = f"RPT-DUP-{timestamp}"
            
            # Create first report
            form_data_1 = {
                'report_number': report_number,
                'license_number': f'LIC-{timestamp}-1',
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'الدوادمي',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 150.0,
                'diameter_mm': 200.0,
                'contractor': 'شركة الشرهان'
            }
            
            response1 = self.session.post(f"{API_BASE}/reports", data=form_data_1)
            
            if response1.status_code != 200:
                self.log_result("Test 1", False, f"Failed to create first report: {response1.status_code}")
                return
            
            # Try to create second report with same report_number
            form_data_2 = {
                'report_number': report_number,  # Same report number
                'license_number': f'LIC-{timestamp}-2',  # Different license
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'مرات',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 120.0,
                'diameter_mm': 180.0,
                'contractor': 'شركة الشرهان'
            }
            
            response2 = self.session.post(f"{API_BASE}/reports", data=form_data_2)
            
            # Second report should fail with 400 error
            if response2.status_code == 400:
                error_data = response2.json()
                error_message = error_data.get('detail', '')
                
                success = report_number in error_message and 'موجود مسبقاً' in error_message
                
                self.log_result(
                    "Test 1", 
                    success, 
                    "Correctly prevented duplicate report number creation",
                    {
                        "report_number": report_number,
                        "error_message": error_message
                    }
                )
            else:
                self.log_result(
                    "Test 1", 
                    False, 
                    f"Expected 400 error for duplicate report number, got: {response2.status_code}",
                    {"response": response2.text}
                )
                
        except Exception as e:
            self.log_result("Test 1", False, f"Error: {str(e)}")

    def test_duplicate_report_number_update(self):
        """Test 2: محاولة تحديث بلاغ موجود برقم بلاغ مكرر (يجب أن يفشل)"""
        print("\n=== Test 2: Duplicate Report Number - Update ===")
        
        if not self.auth_token:
            self.log_result("Test 2", False, "No authentication token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create first report
            report_number_1 = f"RPT-UPD-1-{timestamp}"
            form_data_1 = {
                'report_number': report_number_1,
                'license_number': f'LIC-UPD-1-{timestamp}',
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'الدوادمي',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 150.0,
                'diameter_mm': 200.0,
                'contractor': 'شركة الشرهان'
            }
            
            response1 = self.session.post(f"{API_BASE}/reports", data=form_data_1)
            if response1.status_code != 200:
                self.log_result("Test 2", False, "Failed to create first report")
                return
            
            # Create second report
            report_number_2 = f"RPT-UPD-2-{timestamp}"
            form_data_2 = {
                'report_number': report_number_2,
                'license_number': f'LIC-UPD-2-{timestamp}',
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'مرات',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 120.0,
                'diameter_mm': 180.0,
                'contractor': 'شركة الشرهان'
            }
            
            response2 = self.session.post(f"{API_BASE}/reports", data=form_data_2)
            if response2.status_code != 200:
                self.log_result("Test 2", False, "Failed to create second report")
                return
            
            report2_data = response2.json()
            report2_id = report2_data.get('id')
            
            # Try to update second report with first report's number
            update_data = {'report_number': report_number_1}
            
            response = self.session.put(f"{API_BASE}/reports/{report2_id}", data=update_data)
            
            # Update should fail with 400 error
            if response.status_code == 400:
                error_data = response.json()
                error_message = error_data.get('detail', '')
                
                success = report_number_1 in error_message and 'موجود مسبقاً' in error_message
                
                self.log_result(
                    "Test 2", 
                    success, 
                    "Correctly prevented duplicate report number in update",
                    {"error_message": error_message}
                )
            else:
                self.log_result(
                    "Test 2", 
                    False, 
                    f"Expected 400 error for duplicate report number update, got: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result("Test 2", False, f"Error: {str(e)}")

    def test_license_no_license_issued_creation(self):
        """Test 3: إنشاء بلاغ برخصة "لم يتم إصدار رخصة" (يجب أن ينجح)"""
        print("\n=== Test 3: License 'No License Issued' - Creation ===")
        
        if not self.auth_token:
            self.log_result("Test 3", False, "No authentication token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            form_data = {
                'report_number': f'RPT-NOLIC-{timestamp}',
                'license_number': 'لم يتم إصدار رخصة',
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'الدوادمي',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 150.0,
                'diameter_mm': 200.0,
                'contractor': 'شركة الشرهان'
            }
            
            response = self.session.post(f"{API_BASE}/reports", data=form_data)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('license_number') == 'لم يتم إصدار رخصة'
                
                self.log_result(
                    "Test 3", 
                    success, 
                    "Successfully created report with 'لم يتم إصدار رخصة'",
                    {"report_number": data.get('report_number')}
                )
            else:
                self.log_result(
                    "Test 3", 
                    False, 
                    f"Failed to create report: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result("Test 3", False, f"Error: {str(e)}")

    def test_license_no_license_issued_duplicate(self):
        """Test 4: إنشاء بلاغ آخر بنفس "لم يتم إصدار رخصة" (يجب أن ينجح - السماح بالتكرار)"""
        print("\n=== Test 4: License 'No License Issued' - Duplicate Allowed ===")
        
        if not self.auth_token:
            self.log_result("Test 4", False, "No authentication token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create first report with "لم يتم إصدار رخصة"
            form_data_1 = {
                'report_number': f'RPT-NOLIC-DUP1-{timestamp}',
                'license_number': 'لم يتم إصدار رخصة',
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'الدوادمي',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 150.0,
                'diameter_mm': 200.0,
                'contractor': 'شركة الشرهان'
            }
            
            response1 = self.session.post(f"{API_BASE}/reports", data=form_data_1)
            
            if response1.status_code != 200:
                self.log_result("Test 4", False, "Failed to create first report")
                return
            
            # Create second report with same "لم يتم إصدار رخصة"
            form_data_2 = {
                'report_number': f'RPT-NOLIC-DUP2-{timestamp}',
                'license_number': 'لم يتم إصدار رخصة',  # Same license
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'مرات',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 120.0,
                'diameter_mm': 180.0,
                'contractor': 'شركة الشرهان'
            }
            
            response2 = self.session.post(f"{API_BASE}/reports", data=form_data_2)
            
            # Second report should succeed (duplicates allowed for "لم يتم إصدار رخصة")
            if response2.status_code == 200:
                data2 = response2.json()
                success = data2.get('license_number') == 'لم يتم إصدار رخصة'
                
                self.log_result(
                    "Test 4", 
                    success, 
                    "Successfully allowed duplicate 'لم يتم إصدار رخصة'",
                    {
                        "first_report": form_data_1['report_number'],
                        "second_report": data2.get('report_number')
                    }
                )
            else:
                self.log_result(
                    "Test 4", 
                    False, 
                    f"Failed to create second report: {response2.status_code}",
                    {"response": response2.text}
                )
                
        except Exception as e:
            self.log_result("Test 4", False, f"Error: {str(e)}")

    def test_normal_license_creation(self):
        """Test 5: إنشاء بلاغ برخصة عادية مثل "LIC-123" (يجب أن ينجح)"""
        print("\n=== Test 5: Normal License - Creation ===")
        
        if not self.auth_token:
            self.log_result("Test 5", False, "No authentication token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            license_number = f'LIC-{timestamp}'
            
            form_data = {
                'report_number': f'RPT-NORM-{timestamp}',
                'license_number': license_number,
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'الدوادمي',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 150.0,
                'diameter_mm': 200.0,
                'contractor': 'شركة الشرهان'
            }
            
            response = self.session.post(f"{API_BASE}/reports", data=form_data)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('license_number') == license_number
                
                self.log_result(
                    "Test 5", 
                    success, 
                    f"Successfully created report with normal license: {license_number}",
                    {"report_number": data.get('report_number')}
                )
            else:
                self.log_result(
                    "Test 5", 
                    False, 
                    f"Failed to create report: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result("Test 5", False, f"Error: {str(e)}")

    def test_normal_license_duplicate_creation(self):
        """Test 6: محاولة إنشاء بلاغ آخر بنفس الرخصة العادية "LIC-123" (يجب أن يفشل)"""
        print("\n=== Test 6: Normal License - Duplicate Creation ===")
        
        if not self.auth_token:
            self.log_result("Test 6", False, "No authentication token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            license_number = f'LIC-DUP-{timestamp}'
            
            # Create first report with normal license
            form_data_1 = {
                'report_number': f'RPT-NORM-DUP1-{timestamp}',
                'license_number': license_number,
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'الدوادمي',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 150.0,
                'diameter_mm': 200.0,
                'contractor': 'شركة الشرهان'
            }
            
            response1 = self.session.post(f"{API_BASE}/reports", data=form_data_1)
            
            if response1.status_code != 200:
                self.log_result("Test 6", False, "Failed to create first report")
                return
            
            # Try to create second report with same normal license
            form_data_2 = {
                'report_number': f'RPT-NORM-DUP2-{timestamp}',
                'license_number': license_number,  # Same license
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'مرات',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 120.0,
                'diameter_mm': 180.0,
                'contractor': 'شركة الشرهان'
            }
            
            response2 = self.session.post(f"{API_BASE}/reports", data=form_data_2)
            
            # Second report should fail with 400 error
            if response2.status_code == 400:
                error_data = response2.json()
                error_message = error_data.get('detail', '')
                
                success = license_number in error_message and 'مضاف مسبقاً' in error_message
                
                self.log_result(
                    "Test 6", 
                    success, 
                    "Correctly prevented duplicate normal license creation",
                    {"license_number": license_number, "error_message": error_message}
                )
            else:
                self.log_result(
                    "Test 6", 
                    False, 
                    f"Expected 400 error for duplicate normal license, got: {response2.status_code}",
                    {"response": response2.text}
                )
                
        except Exception as e:
            self.log_result("Test 6", False, f"Error: {str(e)}")

    def test_normal_license_duplicate_update(self):
        """Test 7: تحديث بلاغ موجود برخصة مكررة عادية (يجب أن يفشل)"""
        print("\n=== Test 7: Normal License - Duplicate Update ===")
        
        if not self.auth_token:
            self.log_result("Test 7", False, "No authentication token available")
            return
        
        try:
            import time
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S') + f"_{int(time.time() * 1000) % 10000}"
            
            # Create first report with normal license
            license_number_1 = f'LIC-TEST7-1-{timestamp}'
            form_data_1 = {
                'report_number': f'RPT-TEST7-UPD1-{timestamp}',
                'license_number': license_number_1,
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'الدوادمي',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 150.0,
                'diameter_mm': 200.0,
                'contractor': 'شركة الشرهان'
            }
            
            response1 = self.session.post(f"{API_BASE}/reports", data=form_data_1)
            if response1.status_code != 200:
                self.log_result("Test 7", False, f"Failed to create first report: {response1.status_code} - {response1.text}")
                return
            
            # Create second report with different license
            license_number_2 = f'LIC-TEST7-2-{timestamp}'
            form_data_2 = {
                'report_number': f'RPT-TEST7-UPD2-{timestamp}',
                'license_number': license_number_2,
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'مرات',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 120.0,
                'diameter_mm': 180.0,
                'contractor': 'شركة الشرهان'
            }
            
            response2 = self.session.post(f"{API_BASE}/reports", data=form_data_2)
            if response2.status_code != 200:
                self.log_result("Test 7", False, f"Failed to create second report: {response2.status_code} - {response2.text}")
                return
            
            report2_data = response2.json()
            report2_id = report2_data.get('id')
            
            # Try to update second report with first report's license
            update_data = {'license_number': license_number_1}
            
            response = self.session.put(f"{API_BASE}/reports/{report2_id}", data=update_data)
            
            # Update should fail with 400 error
            if response.status_code == 400:
                error_data = response.json()
                error_message = error_data.get('detail', '')
                
                success = license_number_1 in error_message and 'مضاف مسبقاً' in error_message
                
                self.log_result(
                    "Test 7", 
                    success, 
                    "Correctly prevented duplicate normal license in update",
                    {"error_message": error_message}
                )
            else:
                self.log_result(
                    "Test 7", 
                    False, 
                    f"Expected 400 error for duplicate license update, got: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result("Test 7", False, f"Error: {str(e)}")

    def test_update_to_no_license_issued(self):
        """Test 8: تحديث بلاغ موجود لرخصة "لم يتم إصدار رخصة" (يجب أن ينجح)"""
        print("\n=== Test 8: Update to 'No License Issued' ===")
        
        if not self.auth_token:
            self.log_result("Test 8", False, "No authentication token available")
            return
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create report with normal license
            original_license = f'LIC-ORIG-{timestamp}'
            form_data = {
                'report_number': f'RPT-UPD-NOLIC-{timestamp}',
                'license_number': original_license,
                'report_type': 'ترابي',
                'status': 'تم الإصلاح',
                'governorate': 'الدوادمي',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 150.0,
                'diameter_mm': 200.0,
                'contractor': 'شركة الشرهان'
            }
            
            response = self.session.post(f"{API_BASE}/reports", data=form_data)
            if response.status_code != 200:
                self.log_result("Test 8", False, "Failed to create original report")
                return
            
            report_data = response.json()
            report_id = report_data.get('id')
            
            # Update report to "لم يتم إصدار رخصة"
            update_data = {'license_number': 'لم يتم إصدار رخصة'}
            
            response = self.session.put(f"{API_BASE}/reports/{report_id}", data=update_data)
            
            # Update should succeed
            if response.status_code == 200:
                updated_data = response.json()
                success = updated_data.get('license_number') == 'لم يتم إصدار رخصة'
                
                self.log_result(
                    "Test 8", 
                    success, 
                    "Successfully updated report to 'لم يتم إصدار رخصة'",
                    {
                        "original_license": original_license,
                        "updated_license": updated_data.get('license_number')
                    }
                )
            else:
                self.log_result(
                    "Test 8", 
                    False, 
                    f"Failed to update to 'لم يتم إصدار رخصة': {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result("Test 8", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run comprehensive duplicate validation tests as requested in Arabic review"""
        print("🔍 === COMPREHENSIVE DUPLICATE VALIDATION TESTING ===")
        print("Testing duplicate data validation for report creation and updates")
        print(f"🔗 Backend URL: {API_BASE}")
        
        # Authentication
        if not self.authenticate():
            print("❌ Authentication failed - stopping tests")
            return self.print_summary()
        
        # Run all 8 test scenarios
        self.test_duplicate_report_number_creation()      # Test 1
        self.test_duplicate_report_number_update()        # Test 2
        self.test_license_no_license_issued_creation()    # Test 3
        self.test_license_no_license_issued_duplicate()   # Test 4
        self.test_normal_license_creation()               # Test 5
        self.test_normal_license_duplicate_creation()     # Test 6
        self.test_normal_license_duplicate_update()       # Test 7
        self.test_update_to_no_license_issued()           # Test 8
        
        return self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("🎯 DUPLICATE VALIDATION TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"📊 Results: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Duplicate validation is working correctly.")
        else:
            print("⚠️  Some tests failed. Review the issues above.")
            
        print("\n📋 Test Details:")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result['success'] else "❌"
            print(f"  {status} Test {i}: {result['message']}")
        
        print("\n" + "="*80)
        return passed == total

if __name__ == "__main__":
    tester = DuplicateValidationTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)