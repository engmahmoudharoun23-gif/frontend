#!/usr/bin/env python3
"""
Mahmoud Haroun Review System Testing
Tests the report review functionality specifically for Engineer Mahmoud Haroun
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

class MahmoudHarounTester:
    def __init__(self):
        self.session = requests.Session()
        self.mahmoud_token = None
        self.admin_token = None
        self.first_report_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
        elif details and success:
            print(f"   Info: {details}")
    
    def test_mahmoud_haroun_login(self):
        """Test login as mahmoud_haroun with different passwords as requested in Arabic review"""
        print("\n=== اختبار تسجيل الدخول كمحمود هارون ===")
        
        # Test different passwords as specified in the Arabic review
        passwords_to_try = ["123456", "mahmoud123", "admin123"]
        
        for password in passwords_to_try:
            try:
                login_data = {
                    "username": "mahmoud_haroun",
                    "password": password
                }
                
                print(f"🔐 جرب كلمة مرور: {password}")
                response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                
                if response.status_code == 200:
                    data = response.json()
                    self.mahmoud_token = data.get('access_token')
                    
                    self.log_result(
                        f"تسجيل دخول محمود هارون (كلمة المرور: {password})", 
                        True, 
                        f"نجح تسجيل الدخول بكلمة المرور: {password}",
                        {
                            "username": data.get('user', {}).get('username'),
                            "full_name": data.get('user', {}).get('full_name'),
                            "role": data.get('user', {}).get('role')
                        }
                    )
                    print(f"✅ تم حفظ الـ token بنجاح")
                    return password  # Return successful password
                else:
                    print(f"❌ فشل تسجيل الدخول بكلمة المرور {password}: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ خطأ في تسجيل الدخول بكلمة المرور {password}: {str(e)}")
        
        # If all passwords failed
        self.log_result(
            "تسجيل دخول محمود هارون (جميع كلمات المرور)", 
            False, 
            "فشلت جميع محاولات كلمات المرور لمستخدم mahmoud_haroun",
            {"passwords_tried": passwords_to_try}
        )
        return None

    def test_mahmoud_haroun_auth_me(self):
        """Test GET /api/auth/me for mahmoud_haroun as requested in Arabic review"""
        print("\n=== اختبار GET /api/auth/me ===")
        
        if not self.mahmoud_token:
            self.log_result("اختبار /auth/me", False, "لا يوجد token لمحمود هارون")
            return
        
        try:
            # Set mahmoud token
            self.session.headers.update({'Authorization': f'Bearer {self.mahmoud_token}'})
            
            response = self.session.get(f"{API_BASE}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify expected fields as specified in Arabic review
                username = data.get('username')
                full_name = data.get('full_name')
                role = data.get('role')
                
                expected_username = "mahmoud_haroun"
                expected_full_name = "المهندس محمود هارون"
                expected_role = "user"
                
                username_correct = username == expected_username
                full_name_correct = full_name == expected_full_name
                role_correct = role == expected_role
                
                success = username_correct and full_name_correct and role_correct
                
                self.log_result(
                    "اختبار GET /api/auth/me", 
                    success, 
                    "تم إرجاع البيانات الصحيحة لمحمود هارون",
                    {
                        "username": username,
                        "full_name": full_name,
                        "role": role,
                        "username_correct": username_correct,
                        "full_name_correct": full_name_correct,
                        "role_correct": role_correct
                    }
                )
                
                # Print complete data as requested
                print(f"📋 البيانات الكاملة لمحمود هارون:")
                print(f"   - username: '{username}'")
                print(f"   - full_name: '{full_name}'")
                print(f"   - role: '{role}'")
                print(f"   - id: {data.get('id')}")
                print(f"   - governorates: {data.get('governorates')}")
                print(f"   - projects: {data.get('projects')}")
                
            else:
                self.log_result(
                    "اختبار GET /api/auth/me", 
                    False, 
                    f"فشل GET /api/auth/me: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "اختبار GET /api/auth/me", 
                False, 
                f"خطأ في اختبار /auth/me: {str(e)}"
            )

    def test_mahmoud_haroun_get_reports(self):
        """Test GET /api/reports with mahmoud_haroun token as requested in Arabic review"""
        print("\n=== اختبار GET /api/reports ===")
        
        if not self.mahmoud_token:
            self.log_result("اختبار GET Reports", False, "لا يوجد token لمحمود هارون")
            return None
        
        try:
            # Set mahmoud token
            self.session.headers.update({'Authorization': f'Bearer {self.mahmoud_token}'})
            
            response = self.session.get(f"{API_BASE}/reports")
            
            if response.status_code == 200:
                data = response.json()
                
                # Handle both list format and paginated format
                if isinstance(data, list):
                    reports = data
                    total_count = len(reports)
                elif isinstance(data, dict) and 'reports' in data:
                    reports = data.get('reports', [])
                    total_count = data.get('total_count', len(reports))
                else:
                    reports = []
                    total_count = 0
                
                # Print report count as requested
                print(f"📊 عدد البلاغات: {total_count}")
                
                # Print first report with review_status as requested
                if reports and len(reports) > 0:
                    first_report = reports[0]
                    print(f"📋 أول بلاغ مع حقل review_status:")
                    print(f"   - report_number: {first_report.get('report_number')}")
                    print(f"   - review_status: {first_report.get('review_status')}")
                    print(f"   - governorate: {first_report.get('governorate')}")
                    print(f"   - status: {first_report.get('status')}")
                    print(f"   - id: {first_report.get('id')}")
                    
                    self.first_report_id = first_report.get('id')  # Save for review test
                
                self.log_result(
                    "اختبار GET Reports", 
                    True, 
                    f"تم جلب {total_count} بلاغ بنجاح لمحمود هارون",
                    {
                        "reports_count": total_count,
                        "first_report_id": reports[0].get('id') if reports else None,
                        "first_report_review_status": reports[0].get('review_status') if reports else None
                    }
                )
                
                return reports[0].get('id') if reports else None
                
            else:
                self.log_result(
                    "اختبار GET Reports", 
                    False, 
                    f"فشل GET /api/reports: {response.status_code}",
                    {"response": response.text}
                )
                return None
                
        except Exception as e:
            self.log_result(
                "اختبار GET Reports", 
                False, 
                f"خطأ في جلب البلاغات: {str(e)}"
            )
            return None

    def test_mahmoud_haroun_review_report(self):
        """Test PUT /api/reports/{id}/review with mahmoud_haroun token as requested in Arabic review"""
        print("\n=== اختبار PUT /api/reports/{id}/review ===")
        
        if not self.mahmoud_token:
            self.log_result("اختبار مراجعة البلاغ", False, "لا يوجد token لمحمود هارون")
            return
        
        if not self.first_report_id:
            self.log_result("اختبار مراجعة البلاغ", False, "لا يوجد معرف بلاغ للاختبار")
            return
        
        try:
            # Set mahmoud token
            self.session.headers.update({'Authorization': f'Bearer {self.mahmoud_token}'})
            
            report_id = self.first_report_id
            print(f"🔄 محاولة تحديث حالة المراجعة للبلاغ: {report_id}")
            
            response = self.session.put(f"{API_BASE}/reports/{report_id}/review")
            
            if response.status_code == 200:
                data = response.json()
                
                message = data.get('message', '')
                new_review_status = data.get('review_status', '')
                
                success = "تم تحديث حالة المراجعة بنجاح" in message
                
                # Print success message and new status as requested
                print(f"✅ رسالة النجاح: {message}")
                print(f"📋 حالة المراجعة الجديدة: {new_review_status}")
                
                self.log_result(
                    "اختبار مراجعة البلاغ", 
                    success, 
                    "تم تحديث حالة المراجعة بنجاح بواسطة محمود هارون",
                    {
                        "report_id": report_id,
                        "message": message,
                        "new_review_status": new_review_status
                    }
                )
                
            else:
                self.log_result(
                    "اختبار مراجعة البلاغ", 
                    False, 
                    f"فشل تحديث المراجعة: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "اختبار مراجعة البلاغ", 
                False, 
                f"خطأ في تحديث حالة المراجعة: {str(e)}"
            )

    def test_admin_review_permissions(self):
        """Test that admin user cannot review reports (only mahmoud_haroun can) as requested in Arabic review"""
        print("\n=== اختبار الصلاحيات (مع مستخدم آخر) ===")
        
        if not self.first_report_id:
            self.log_result("اختبار صلاحيات المسؤول", False, "لا يوجد معرف بلاغ لاختبار الصلاحيات")
            return
        
        try:
            # First login as admin with password 123456 as specified
            admin_login_data = {
                "username": "admin",
                "password": "123456"
            }
            
            print(f"🔐 تسجيل دخول كـ admin")
            response = self.session.post(f"{API_BASE}/auth/login", json=admin_login_data)
            
            if response.status_code == 200:
                admin_data = response.json()
                self.admin_token = admin_data.get('access_token')
                
                # Set admin token
                self.session.headers.update({'Authorization': f'Bearer {self.admin_token}'})
                
                # Try to update review status as admin (should fail)
                report_id = self.first_report_id
                print(f"🚫 محاولة تحديث حالة المراجعة كـ admin (يجب أن تفشل)")
                
                response = self.session.put(f"{API_BASE}/reports/{report_id}/review")
                
                if response.status_code == 403:
                    error_data = response.json()
                    error_message = error_data.get('detail', '')
                    
                    expected_message = "فقط المهندس محمود هارون يمكنه مراجعة البلاغات"
                    success = expected_message in error_message
                    
                    print(f"✅ رسالة الخطأ المتوقعة: {error_message}")
                    
                    self.log_result(
                        "اختبار صلاحيات المسؤول", 
                        success, 
                        f"تم منع المسؤول من المراجعة بشكل صحيح: {error_message}",
                        {
                            "report_id": report_id,
                            "error_message": error_message,
                            "expected_message": expected_message,
                            "status_code": response.status_code
                        }
                    )
                    
                else:
                    self.log_result(
                        "اختبار صلاحيات المسؤول", 
                        False, 
                        f"توقع خطأ 403 لكن حصل على: {response.status_code}",
                        {"response": response.text}
                    )
                    
            else:
                self.log_result(
                    "اختبار صلاحيات المسؤول", 
                    False, 
                    f"فشل تسجيل دخول المسؤول: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "اختبار صلاحيات المسؤول", 
                False, 
                f"خطأ في اختبار صلاحيات المسؤول: {str(e)}"
            )

    def run_complete_test(self):
        """Run complete Mahmoud Haroun review system test as requested in Arabic review"""
        print("🎯 === اختبار نظام مراجعة البلاغات بالكامل ===")
        print("الهدف: التحقق من أن صلاحية المراجعة تعمل فقط للمهندس محمود هارون")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Step 1: Test login with different passwords
        print("1️⃣ اختبار تسجيل الدخول كمحمود هارون:")
        successful_password = self.test_mahmoud_haroun_login()
        
        if successful_password:
            # Step 2: Test GET /api/auth/me
            print("\n2️⃣ اختبار GET /api/auth/me:")
            self.test_mahmoud_haroun_auth_me()
            
            # Step 3: Test GET /api/reports
            print("\n3️⃣ اختبار GET /api/reports:")
            first_report_id = self.test_mahmoud_haroun_get_reports()
            
            if first_report_id:
                # Step 4: Test PUT /api/reports/{id}/review
                print("\n4️⃣ اختبار PUT /api/reports/{id}/review:")
                self.test_mahmoud_haroun_review_report()
                
                # Step 5: Test permissions with admin user
                print("\n5️⃣ اختبار الصلاحيات (مع مستخدم آخر):")
                self.test_admin_review_permissions()
            else:
                print("❌ لا توجد بلاغات متاحة لاختبار المراجعة")
        else:
            print("❌ لم يتم العثور على مستخدم mahmoud_haroun أو كلمات المرور غير صحيحة")
        
        print("\n" + "=" * 60)
        print("🏁 انتهى اختبار نظام مراجعة البلاغات")

if __name__ == "__main__":
    tester = MahmoudHarounTester()
    tester.run_complete_test()