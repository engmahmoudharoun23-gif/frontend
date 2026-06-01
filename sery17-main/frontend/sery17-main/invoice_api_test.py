#!/usr/bin/env python3
"""
Comprehensive Custody Invoices Backend API Testing
Tests all invoice APIs with proper response handling
"""

import requests
import json
import base64
from datetime import datetime, timezone
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class InvoiceAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.tokens = {}
        
        # Test users as specified in Arabic request
        self.test_users = {
            'admin': {'username': 'admin', 'password': '123456'},
            'level2': {'username': 'Eng Medhat Hussien', 'password': '123456'},
            'level3': {'username': 'Mohamed Shawqi', 'password': '123456'}
        }
        
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
    
    def login_user(self, user_type):
        """Login as specific user type and store token"""
        if user_type not in self.test_users:
            return False
            
        user_data = self.test_users[user_type]
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=user_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                user_info = data.get('user', {})
                
                self.tokens[user_type] = {
                    'token': token,
                    'user_id': user_info.get('id'),
                    'username': user_info.get('username'),
                    'role': user_info.get('role'),
                    'projects': user_info.get('projects', []),
                    'governorates': user_info.get('governorates', [])
                }
                
                self.log_result(
                    f"Login {user_type}", 
                    True, 
                    f"Successfully logged in as {user_data['username']}",
                    {
                        "role": user_info.get('role'),
                        "projects": user_info.get('projects', []),
                        "governorates": user_info.get('governorates', [])
                    }
                )
                return True
            else:
                self.log_result(f"Login {user_type}", False, f"Login failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result(f"Login {user_type}", False, f"Login error: {str(e)}")
            return False
    
    def set_auth_header(self, user_type):
        """Set authorization header for specific user"""
        if user_type in self.tokens:
            token = self.tokens[user_type]['token']
            self.session.headers.update({'Authorization': f'Bearer {token}'})
            return True
        return False
    
    def create_test_image(self):
        """Create a test invoice image (base64)"""
        image_data = b"test_invoice_image_data_" + b"x" * 1000
        encoded = base64.b64encode(image_data).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"
    
    def test_invoice_creation_api(self):
        """Test POST /api/invoices endpoint"""
        print("\n=== Testing POST /api/invoices ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("POST /api/invoices", False, "No auth token for level3")
            return None
        
        invoice_data = {
            "invoice_number": "INV-API-TEST-001",
            "amount": 1500.75,
            "description": "فاتورة اختبار API",
            "image": self.create_test_image(),
            "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
            "governorate": "الدوادمي"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/invoices", json=invoice_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response format
                has_message = 'message' in data
                has_id = 'id' in data
                success_message = "تم رفع الفاتورة بنجاح" in data.get('message', '')
                
                success = has_message and has_id and success_message
                
                self.log_result(
                    "POST /api/invoices", 
                    success, 
                    "Invoice creation API works correctly",
                    {
                        "response_format": "message + id",
                        "invoice_id": data.get('id'),
                        "message": data.get('message'),
                        "has_required_fields": success
                    }
                )
                return data.get('id') if success else None
            else:
                self.log_result(
                    "POST /api/invoices", 
                    False, 
                    f"API failed with status {response.status_code}",
                    {"response": response.text}
                )
                return None
                
        except Exception as e:
            self.log_result("POST /api/invoices", False, f"API error: {str(e)}")
            return None
    
    def test_invoice_retrieval_api(self):
        """Test GET /api/invoices endpoint"""
        print("\n=== Testing GET /api/invoices ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("GET /api/invoices", False, "No auth token for level3")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/invoices")
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    # Check invoice structure
                    sample_invoice = invoices[0] if invoices else {}
                    required_fields = ['id', 'invoice_number', 'amount', 'description', 'status', 'uploaded_by', 'project']
                    
                    has_required_fields = all(field in sample_invoice for field in required_fields) if invoices else True
                    
                    self.log_result(
                        "GET /api/invoices", 
                        True, 
                        f"Invoice retrieval API works - {len(invoices)} invoices returned",
                        {
                            "invoices_count": len(invoices),
                            "response_type": "array",
                            "has_required_fields": has_required_fields,
                            "sample_fields": list(sample_invoice.keys()) if invoices else []
                        }
                    )
                else:
                    self.log_result(
                        "GET /api/invoices", 
                        False, 
                        "Response is not an array",
                        {"response_type": type(invoices)}
                    )
            else:
                self.log_result(
                    "GET /api/invoices", 
                    False, 
                    f"API failed with status {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result("GET /api/invoices", False, f"API error: {str(e)}")
    
    def test_invoice_filtering_api(self):
        """Test GET /api/invoices with filters"""
        print("\n=== Testing GET /api/invoices with filters ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("GET /api/invoices (filters)", False, "No auth token for level3")
            return
        
        # Test status filter
        try:
            response = self.session.get(f"{API_BASE}/invoices", params={'status': 'pending'})
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    # Check if all returned invoices have pending status
                    all_pending = all(inv.get('status') == 'pending' for inv in invoices) if invoices else True
                    
                    self.log_result(
                        "GET /api/invoices (status filter)", 
                        all_pending, 
                        f"Status filtering works - {len(invoices)} pending invoices",
                        {
                            "filter": "status=pending",
                            "invoices_count": len(invoices),
                            "all_pending": all_pending
                        }
                    )
                else:
                    self.log_result("GET /api/invoices (status filter)", False, "Response not array")
            else:
                self.log_result("GET /api/invoices (status filter)", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("GET /api/invoices (status filter)", False, f"Error: {str(e)}")
        
        # Test project filter
        try:
            project = "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"
            response = self.session.get(f"{API_BASE}/invoices", params={'project': project})
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    all_correct_project = all(inv.get('project') == project for inv in invoices) if invoices else True
                    
                    self.log_result(
                        "GET /api/invoices (project filter)", 
                        all_correct_project, 
                        f"Project filtering works - {len(invoices)} invoices from project",
                        {
                            "filter": "project filter",
                            "invoices_count": len(invoices),
                            "all_correct_project": all_correct_project
                        }
                    )
                else:
                    self.log_result("GET /api/invoices (project filter)", False, "Response not array")
            else:
                self.log_result("GET /api/invoices (project filter)", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("GET /api/invoices (project filter)", False, f"Error: {str(e)}")
    
    def test_invoice_update_api(self, invoice_id):
        """Test PUT /api/invoices/{id} endpoint"""
        print("\n=== Testing PUT /api/invoices/{id} ===")
        
        if not invoice_id:
            self.log_result("PUT /api/invoices/{id}", False, "No invoice ID provided")
            return
        
        if not self.set_auth_header('level3'):
            self.log_result("PUT /api/invoices/{id}", False, "No auth token for level3")
            return
        
        update_data = {
            "invoice_number": "INV-API-UPDATED",
            "amount": 2000.50,
            "description": "فاتورة محدثة عبر API",
            "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
            "governorate": "عفيف"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/invoices/{invoice_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response format
                has_message = 'message' in data
                success_message = "تم تحديث الفاتورة بنجاح" in data.get('message', '')
                
                success = has_message and success_message
                
                self.log_result(
                    "PUT /api/invoices/{id}", 
                    success, 
                    "Invoice update API works correctly",
                    {
                        "invoice_id": invoice_id,
                        "message": data.get('message'),
                        "response_format": "message"
                    }
                )
            else:
                self.log_result(
                    "PUT /api/invoices/{id}", 
                    False, 
                    f"API failed with status {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result("PUT /api/invoices/{id}", False, f"API error: {str(e)}")
    
    def test_invoice_approval_api(self, invoice_id):
        """Test PUT /api/invoices/{id}/approve endpoint"""
        print("\n=== Testing PUT /api/invoices/{id}/approve ===")
        
        if not invoice_id:
            self.log_result("PUT /api/invoices/{id}/approve", False, "No invoice ID provided")
            return
        
        if not self.set_auth_header('level2'):
            self.log_result("PUT /api/invoices/{id}/approve", False, "No auth token for level2")
            return
        
        approval_data = {
            "notes": "تم الاعتماد من قبل المدير عبر API"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/invoices/{invoice_id}/approve", json=approval_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response format
                has_message = 'message' in data
                success_message = "تم اعتماد الفاتورة بنجاح" in data.get('message', '')
                
                success = has_message and success_message
                
                self.log_result(
                    "PUT /api/invoices/{id}/approve", 
                    success, 
                    "Invoice approval API works correctly",
                    {
                        "invoice_id": invoice_id,
                        "message": data.get('message'),
                        "response_format": "message"
                    }
                )
            else:
                self.log_result(
                    "PUT /api/invoices/{id}/approve", 
                    False, 
                    f"API failed with status {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result("PUT /api/invoices/{id}/approve", False, f"API error: {str(e)}")
    
    def test_invoice_rejection_api(self):
        """Test PUT /api/invoices/{id}/reject endpoint"""
        print("\n=== Testing PUT /api/invoices/{id}/reject ===")
        
        # First create an invoice to reject
        if not self.set_auth_header('level3'):
            self.log_result("PUT /api/invoices/{id}/reject", False, "No auth token for level3")
            return
        
        # Create invoice
        invoice_data = {
            "invoice_number": "INV-REJECT-API-TEST",
            "amount": 750.00,
            "description": "فاتورة للرفض عبر API",
            "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
            "governorate": "القصب"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/invoices", json=invoice_data)
            
            if response.status_code == 200:
                invoice_id = response.json().get('id')
                
                # Switch to level2 user for rejection
                if not self.set_auth_header('level2'):
                    self.log_result("PUT /api/invoices/{id}/reject", False, "No auth token for level2")
                    return
                
                rejection_data = {
                    "notes": "تم رفض الفاتورة عبر API"
                }
                
                reject_response = self.session.put(f"{API_BASE}/invoices/{invoice_id}/reject", json=rejection_data)
                
                if reject_response.status_code == 200:
                    data = reject_response.json()
                    
                    # Check response format
                    has_message = 'message' in data
                    success_message = "تم رفض الفاتورة" in data.get('message', '')
                    
                    success = has_message and success_message
                    
                    self.log_result(
                        "PUT /api/invoices/{id}/reject", 
                        success, 
                        "Invoice rejection API works correctly",
                        {
                            "invoice_id": invoice_id,
                            "message": data.get('message'),
                            "response_format": "message"
                        }
                    )
                else:
                    self.log_result(
                        "PUT /api/invoices/{id}/reject", 
                        False, 
                        f"Rejection failed with status {reject_response.status_code}",
                        {"response": reject_response.text}
                    )
            else:
                self.log_result("PUT /api/invoices/{id}/reject", False, "Failed to create test invoice")
                
        except Exception as e:
            self.log_result("PUT /api/invoices/{id}/reject", False, f"API error: {str(e)}")
    
    def test_invoice_deletion_api(self):
        """Test DELETE /api/invoices/{id} endpoint"""
        print("\n=== Testing DELETE /api/invoices/{id} ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("DELETE /api/invoices/{id}", False, "No auth token for level3")
            return
        
        # Create invoice to delete
        invoice_data = {
            "invoice_number": "INV-DELETE-API-TEST",
            "amount": 500.00,
            "description": "فاتورة للحذف عبر API",
            "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
            "governorate": "شقراء"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/invoices", json=invoice_data)
            
            if response.status_code == 200:
                invoice_id = response.json().get('id')
                
                # Delete the invoice
                delete_response = self.session.delete(f"{API_BASE}/invoices/{invoice_id}")
                
                if delete_response.status_code == 200:
                    data = delete_response.json()
                    
                    # Check response format
                    has_message = 'message' in data
                    success_message = "تم حذف الفاتورة" in data.get('message', '')
                    
                    success = has_message and success_message
                    
                    self.log_result(
                        "DELETE /api/invoices/{id}", 
                        success, 
                        "Invoice deletion API works correctly",
                        {
                            "invoice_id": invoice_id,
                            "message": data.get('message'),
                            "response_format": "message"
                        }
                    )
                else:
                    self.log_result(
                        "DELETE /api/invoices/{id}", 
                        False, 
                        f"Deletion failed with status {delete_response.status_code}",
                        {"response": delete_response.text}
                    )
            else:
                self.log_result("DELETE /api/invoices/{id}", False, "Failed to create test invoice")
                
        except Exception as e:
            self.log_result("DELETE /api/invoices/{id}", False, f"API error: {str(e)}")
    
    def test_permission_levels(self):
        """Test different permission levels work correctly"""
        print("\n=== Testing Permission Levels ===")
        
        # Test Level 3 cannot approve (should get 403)
        if not self.set_auth_header('level3'):
            self.log_result("Permission Levels", False, "No auth token for level3")
            return
        
        # Create test invoice
        invoice_data = {
            "invoice_number": "INV-PERM-TEST",
            "amount": 300.00,
            "description": "فاتورة لاختبار الصلاحيات",
            "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
            "governorate": "المزاحمية"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/invoices", json=invoice_data)
            
            if response.status_code == 200:
                invoice_id = response.json().get('id')
                
                # Try to approve as Level 3 (should fail)
                approval_data = {"notes": "محاولة اعتماد غير مصرحة"}
                approve_response = self.session.put(f"{API_BASE}/invoices/{invoice_id}/approve", json=approval_data)
                
                # Should get 403 Forbidden
                permission_blocked = approve_response.status_code == 403
                
                self.log_result(
                    "Permission Levels", 
                    permission_blocked, 
                    f"Level 3 correctly blocked from approving (Status: {approve_response.status_code})",
                    {
                        "invoice_id": invoice_id,
                        "approve_status": approve_response.status_code,
                        "correctly_blocked": permission_blocked
                    }
                )
            else:
                self.log_result("Permission Levels", False, "Failed to create test invoice")
                
        except Exception as e:
            self.log_result("Permission Levels", False, f"Error: {str(e)}")
    
    def test_admin_permissions(self):
        """Test admin can see approved invoices and give final approval"""
        print("\n=== Testing Admin Permissions ===")
        
        if not self.set_auth_header('admin'):
            self.log_result("Admin Permissions", False, "No auth token for admin")
            return
        
        try:
            # Test admin can access invoices
            response = self.session.get(f"{API_BASE}/invoices")
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    # Admin should see approved invoices
                    approved_invoices = [inv for inv in invoices if inv.get('status') in ['approved_by_manager', 'approved_by_admin']]
                    
                    self.log_result(
                        "Admin Permissions", 
                        True, 
                        f"Admin can access invoices - {len(approved_invoices)} approved of {len(invoices)} total",
                        {
                            "total_invoices": len(invoices),
                            "approved_invoices": len(approved_invoices),
                            "admin_access": True
                        }
                    )
                else:
                    self.log_result("Admin Permissions", False, "Response not array")
            else:
                self.log_result("Admin Permissions", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Admin Permissions", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all invoice API tests"""
        print("🚀 Starting Comprehensive Custody Invoices API Testing")
        print("=" * 70)
        
        # Login all users
        for user_type in ['admin', 'level2', 'level3']:
            if not self.login_user(user_type):
                print(f"❌ Failed to login {user_type}, skipping related tests")
                continue
        
        # Test all invoice APIs
        invoice_id = self.test_invoice_creation_api()
        self.test_invoice_retrieval_api()
        self.test_invoice_filtering_api()
        
        if invoice_id:
            self.test_invoice_update_api(invoice_id)
            self.test_invoice_approval_api(invoice_id)
        
        self.test_invoice_rejection_api()
        self.test_invoice_deletion_api()
        self.test_permission_levels()
        self.test_admin_permissions()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📊 CUSTODY INVOICES API TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"  - {result['test']}: {result['message']}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests*100) if total_tests > 0 else 0,
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = InvoiceAPITester()
    tester.run_all_tests()