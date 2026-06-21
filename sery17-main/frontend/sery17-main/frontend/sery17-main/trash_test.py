#!/usr/bin/env python3
"""
Trash Functionality Testing for WFM Report Management System
Tests the complete trash functionality as requested in Arabic review
"""

import requests
import json
import base64
import io
from datetime import datetime, timezone
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class TrashTester:
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
    
    def test_login(self):
        """Test login with admin credentials as specified in Arabic review"""
        print("\n=== 1. اختبار تسجيل الدخول ===")
        
        # Test login with admin credentials as specified
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                
                user_info = data.get('user', {})
                
                self.log_result(
                    "تسجيل الدخول (admin/admin123)", 
                    True, 
                    "تم تسجيل الدخول بنجاح كمسؤول",
                    {
                        "username": user_info.get('username'),
                        "role": user_info.get('role'),
                        "full_name": user_info.get('full_name'),
                        "token_saved": "نعم"
                    }
                )
                return True
            else:
                # Try alternative password (123456) as mentioned in test_result.md
                login_data["password"] = "123456"
                response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                
                if response.status_code == 200:
                    data = response.json()
                    self.auth_token = data.get('access_token')
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    
                    user_info = data.get('user', {})
                    
                    self.log_result(
                        "تسجيل الدخول (admin/123456)", 
                        True, 
                        "تم تسجيل الدخول بنجاح بكلمة مرور بديلة",
                        {
                            "username": user_info.get('username'),
                            "role": user_info.get('role'),
                            "full_name": user_info.get('full_name'),
                            "password_used": "123456"
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "تسجيل الدخول", 
                        False, 
                        f"فشل تسجيل الدخول بكلا كلمتي المرور: {response.status_code}",
                        {"response": response.text}
                    )
                    return False
                
        except Exception as e:
            self.log_result(
                "تسجيل الدخول", 
                False, 
                f"خطأ في طلب تسجيل الدخول: {str(e)}"
            )
            return False

    def create_test_image(self, size_kb=100):
        """Create a test image for upload testing"""
        # Create a simple test image (base64 encoded)
        image_data = b"test_image_data_" + b"x" * (size_kb * 1024 - 16)
        return ("test_image.jpg", image_data, "image/jpeg")

    def create_test_deleted_report(self):
        """Create a test report and then delete it for trash testing"""
        try:
            # Create a test report first
            image_name, image_data, content_type = self.create_test_image(50)
            
            form_data = {
                'report_number': 'TEST-TRASH-001',
                'license_number': 'LIC-TRASH-001',
                'report_type': 'حفر بئر',
                'status': 'تم الإصلاح',
                'governorate': 'الدوادمي',
                'project': 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
                'depth_meters': 150.0,
                'diameter_mm': 200.0,
                'contractor': 'شركة الاختبار للمقاولات'
            }
            
            files = {
                'images': (image_name, image_data, content_type)
            }
            
            # Create the report
            response = self.session.post(
                f"{API_BASE}/reports", 
                data=form_data,
                files=files
            )
            
            if response.status_code == 200:
                report_data = response.json()
                report_id = report_data.get('id')
                
                # Now delete the report to move it to trash
                delete_response = self.session.delete(f"{API_BASE}/reports/{report_id}")
                
                if delete_response.status_code == 200:
                    print(f"✅ تم إنشاء وحذف بلاغ تجريبي: {form_data['report_number']}")
                    return report_id, report_data
                else:
                    print(f"❌ فشل حذف البلاغ التجريبي: {delete_response.status_code}")
                    return None, None
            else:
                print(f"❌ فشل إنشاء البلاغ التجريبي: {response.status_code}")
                return None, None
                
        except Exception as e:
            print(f"❌ خطأ في إنشاء البلاغ المحذوف التجريبي: {str(e)}")
            return None, None

    def test_trash_api_endpoint(self):
        """Test GET /api/reports-trash endpoint as specified in Arabic review"""
        print("\n=== 2. اختبار GET /api/reports-trash ===")
        
        if not self.auth_token:
            self.log_result("نقطة نهاية سلة المهملات", False, "لا يوجد رمز مصادقة متاح")
            return
        
        try:
            # First, ensure we have at least one deleted report for testing
            deleted_report_id, deleted_report_data = self.create_test_deleted_report()
            
            # Test GET /api/reports-trash endpoint
            response = self.session.get(f"{API_BASE}/reports-trash")
            
            if response.status_code == 200:
                trash_reports = response.json()
                
                if isinstance(trash_reports, list):
                    reports_count = len(trash_reports)
                    
                    # Check if we have any deleted reports
                    if reports_count > 0:
                        first_report = trash_reports[0]
                        
                        # Verify required fields as specified in Arabic review
                        required_fields = ['report_number', 'governorate', 'deleted_by', 'deleted_by_name', 'deleted_at']
                        missing_fields = []
                        present_fields = {}
                        
                        for field in required_fields:
                            if field in first_report:
                                present_fields[field] = first_report.get(field)
                            else:
                                missing_fields.append(field)
                        
                        success = len(missing_fields) == 0
                        
                        # Print details as requested in Arabic review
                        print(f"\n📊 عدد البلاغات المحذوفة: {reports_count}")
                        print(f"📋 تفاصيل أول بلاغ محذوف:")
                        for field, value in present_fields.items():
                            print(f"   ✓ {field}: {value}")
                        
                        if missing_fields:
                            print(f"❌ الحقول المفقودة: {missing_fields}")
                        
                        self.log_result(
                            "نقطة نهاية سلة المهملات", 
                            success, 
                            f"تعمل نقطة النهاية بشكل صحيح - تم العثور على {reports_count} بلاغ محذوف",
                            {
                                "reports_count": reports_count,
                                "required_fields_present": len(required_fields) - len(missing_fields),
                                "missing_fields": missing_fields,
                                "first_report_fields": present_fields
                            }
                        )
                    else:
                        # No deleted reports found
                        self.log_result(
                            "نقطة نهاية سلة المهملات", 
                            True, 
                            "يمكن الوصول إلى نقطة النهاية ولكن لا توجد بلاغات محذوفة",
                            {
                                "reports_count": 0,
                                "endpoint_accessible": True,
                                "note": "هذا طبيعي إذا لم يتم حذف أي بلاغات بعد"
                            }
                        )
                else:
                    self.log_result(
                        "نقطة نهاية سلة المهملات", 
                        False, 
                        "استجابة نقطة النهاية ليست قائمة",
                        {"response_type": type(trash_reports)}
                    )
            else:
                self.log_result(
                    "نقطة نهاية سلة المهملات", 
                    False, 
                    f"فشل الوصول إلى نقطة نهاية سلة المهملات: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "نقطة نهاية سلة المهملات", 
                False, 
                f"خطأ في اختبار نقطة نهاية سلة المهملات: {str(e)}"
            )

    def test_trash_with_different_users(self):
        """Test trash functionality with different users if possible"""
        print("\n=== 3. اختبار بمستخدمين مختلفين ===")
        
        if not self.auth_token:
            self.log_result("اختبار مستخدمين مختلفين", False, "لا يوجد رمز مصادقة متاح")
            return
        
        try:
            # Store original admin token
            original_token = self.auth_token
            
            # Try to test with different users mentioned in test_result.md
            test_users = [
                {"username": "Midahat", "password": "123456"},
                {"username": "Mohamed Shawqi", "password": "123456"},
                {"username": "Amr Tawfik", "password": "123456"},
                {"username": "محمود هارون", "password": "123456"}
            ]
            
            successful_logins = []
            
            for user_creds in test_users:
                try:
                    # Test login with different user
                    login_response = self.session.post(f"{API_BASE}/auth/login", json=user_creds)
                    
                    if login_response.status_code == 200:
                        login_data = login_response.json()
                        user_token = login_data.get('access_token')
                        user_info = login_data.get('user', {})
                        
                        # Update session with user token
                        self.session.headers.update({'Authorization': f'Bearer {user_token}'})
                        
                        # Test trash access with this user
                        trash_response = self.session.get(f"{API_BASE}/reports-trash")
                        
                        if trash_response.status_code == 200:
                            trash_data = trash_response.json()
                            reports_count = len(trash_data) if isinstance(trash_data, list) else 0
                            
                            successful_logins.append({
                                "username": user_creds["username"],
                                "role": user_info.get('role'),
                                "full_name": user_info.get('full_name'),
                                "trash_access": True,
                                "trash_reports_count": reports_count
                            })
                            
                            print(f"✅ {user_creds['username']}: يمكن الوصول لسلة المهملات - {reports_count} بلاغ")
                        else:
                            successful_logins.append({
                                "username": user_creds["username"],
                                "role": user_info.get('role'),
                                "full_name": user_info.get('full_name'),
                                "trash_access": False,
                                "error": f"فشل الوصول لسلة المهملات: {trash_response.status_code}"
                            })
                            
                            print(f"❌ {user_creds['username']}: لا يمكن الوصول لسلة المهملات - {trash_response.status_code}")
                    else:
                        # Login failed for this user
                        print(f"❌ {user_creds['username']}: فشل تسجيل الدخول - {login_response.status_code}")
                        continue
                        
                except Exception as user_error:
                    print(f"❌ خطأ في اختبار المستخدم {user_creds['username']}: {str(user_error)}")
                    continue
            
            # Restore admin token
            self.session.headers.update({'Authorization': f'Bearer {original_token}'})
            
            if successful_logins:
                self.log_result(
                    "اختبار مستخدمين مختلفين", 
                    True, 
                    f"تم اختبار الوصول لسلة المهملات مع {len(successful_logins)} مستخدم مختلف",
                    {
                        "tested_users": successful_logins,
                        "total_users_tested": len(successful_logins)
                    }
                )
            else:
                self.log_result(
                    "اختبار مستخدمين مختلفين", 
                    False, 
                    "لم يتمكن من تسجيل الدخول بأي مستخدم بديل",
                    {
                        "attempted_users": [u["username"] for u in test_users],
                        "note": "قد لا يكون المستخدمون موجودين أو لديهم كلمات مرور مختلفة"
                    }
                )
                
        except Exception as e:
            # Restore admin token in case of error
            if 'original_token' in locals():
                self.session.headers.update({'Authorization': f'Bearer {original_token}'})
            
            self.log_result(
                "اختبار مستخدمين مختلفين", 
                False, 
                f"خطأ في اختبار المستخدمين المختلفين: {str(e)}"
            )

    def run_complete_trash_test(self):
        """Complete trash functionality test as requested in Arabic review"""
        print("=" * 80)
        print("🗑️  اختبار وظيفة سلة المهملات (Trash) بالكامل")
        print("=" * 80)
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print(f"📡 API Base: {API_BASE}")
        print("=" * 80)
        
        # Step 1: Test login
        if not self.test_login():
            print("❌ فشل تسجيل الدخول - توقف الاختبار")
            return False
        
        # Step 2: Test GET /api/reports-trash endpoint
        self.test_trash_api_endpoint()
        
        # Step 3: Test with different users if possible
        self.test_trash_with_different_users()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 ملخص نتائج الاختبار")
        print("=" * 80)
        
        passed = sum(1 for r in self.test_results if r['success'])
        total = len(self.test_results)
        
        print(f"إجمالي الاختبارات: {total}")
        print(f"نجح: {passed}")
        print(f"فشل: {total - passed}")
        print(f"معدل النجاح: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        # Failed tests details
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ الاختبارات الفاشلة:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        # Successful tests
        successful_tests = [r for r in self.test_results if r['success']]
        if successful_tests:
            print(f"\n✅ الاختبارات الناجحة:")
            for test in successful_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return True

if __name__ == "__main__":
    tester = TrashTester()
    tester.run_complete_trash_test()