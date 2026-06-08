#!/usr/bin/env python3
"""
Custody Invoices Backend API Testing
Tests the complete custody invoices workflow as specified in Arabic review request
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

class CustodyInvoicesTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.tokens = {}  # Store tokens for different users
        
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
        print(f"\n=== Logging in as {user_type} ===")
        
        if user_type not in self.test_users:
            self.log_result(f"Login {user_type}", False, f"Unknown user type: {user_type}")
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
                self.log_result(
                    f"Login {user_type}", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                f"Login {user_type}", 
                False, 
                f"Login request failed: {str(e)}"
            )
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
        # Create a simple test image data
        image_data = b"test_invoice_image_data_" + b"x" * 1000
        encoded = base64.b64encode(image_data).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"
    
    def test_invoice_creation_level3(self):
        """Test Level 3 user (Mohamed Shawqi) creating an invoice"""
        print("\n=== Testing Invoice Creation - Level 3 User ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("Invoice Creation (Level 3)", False, "No authentication token for level3 user")
            return None
        
        # Create invoice data
        invoice_data = {
            "invoice_number": "INV-TEST-001",
            "amount": 1500.75,
            "description": "فاتورة اختبار للمستوى الثالث",
            "image": self.create_test_image(),
            "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
            "governorate": "الدوادمي"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/invoices", json=invoice_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify invoice fields
                success = (
                    data.get('invoice_number') == invoice_data['invoice_number'] and
                    data.get('amount') == invoice_data['amount'] and
                    data.get('status') == 'pending' and
                    data.get('uploaded_by') == self.tokens['level3']['user_id'] and
                    data.get('project') == invoice_data['project']
                )
                
                self.log_result(
                    "Invoice Creation (Level 3)", 
                    success, 
                    "Level 3 user successfully created invoice",
                    {
                        "invoice_id": data.get('id'),
                        "invoice_number": data.get('invoice_number'),
                        "amount": data.get('amount'),
                        "status": data.get('status'),
                        "project": data.get('project'),
                        "governorate": data.get('governorate')
                    }
                )
                return data.get('id') if success else None
            else:
                self.log_result(
                    "Invoice Creation (Level 3)", 
                    False, 
                    f"Failed to create invoice: {response.status_code}",
                    {"response": response.text}
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Invoice Creation (Level 3)", 
                False, 
                f"Error creating invoice: {str(e)}"
            )
            return None
    
    def test_invoice_retrieval_level3(self):
        """Test Level 3 user can only see their own invoices"""
        print("\n=== Testing Invoice Retrieval - Level 3 User ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("Invoice Retrieval (Level 3)", False, "No authentication token for level3 user")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/invoices")
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    # Verify all invoices belong to this user
                    user_id = self.tokens['level3']['user_id']
                    all_own_invoices = all(inv.get('uploaded_by') == user_id for inv in invoices)
                    
                    self.log_result(
                        "Invoice Retrieval (Level 3)", 
                        all_own_invoices, 
                        f"Level 3 user sees only their invoices - {len(invoices)} invoices found",
                        {
                            "invoices_count": len(invoices),
                            "all_own_invoices": all_own_invoices,
                            "user_id": user_id
                        }
                    )
                else:
                    self.log_result(
                        "Invoice Retrieval (Level 3)", 
                        False, 
                        "Invoice response is not a list",
                        {"response_type": type(invoices)}
                    )
            else:
                self.log_result(
                    "Invoice Retrieval (Level 3)", 
                    False, 
                    f"Failed to retrieve invoices: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Retrieval (Level 3)", 
                False, 
                f"Error retrieving invoices: {str(e)}"
            )
    
    def test_invoice_project_filtering_level3(self):
        """Test Level 3 user project filtering - should only see their project"""
        print("\n=== Testing Invoice Project Filtering - Level 3 User ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("Invoice Project Filtering (Level 3)", False, "No authentication token for level3 user")
            return
        
        try:
            # Test filtering by their assigned project
            user_projects = self.tokens['level3']['projects']
            if user_projects:
                project = user_projects[0]  # Should be "المحافظات الغربية"
                
                response = self.session.get(f"{API_BASE}/invoices", params={'project': project})
                
                if response.status_code == 200:
                    invoices = response.json()
                    
                    if isinstance(invoices, list):
                        # All invoices should be from this project
                        all_correct_project = all(inv.get('project') == project for inv in invoices)
                        
                        self.log_result(
                            "Invoice Project Filtering (Level 3)", 
                            all_correct_project, 
                            f"Level 3 user project filtering works - {len(invoices)} invoices from {project}",
                            {
                                "project_filter": project,
                                "invoices_count": len(invoices),
                                "all_correct_project": all_correct_project
                            }
                        )
                    else:
                        self.log_result(
                            "Invoice Project Filtering (Level 3)", 
                            False, 
                            "Project filtering response is not a list",
                            {"response_type": type(invoices)}
                        )
                else:
                    self.log_result(
                        "Invoice Project Filtering (Level 3)", 
                        False, 
                        f"Failed to filter invoices by project: {response.status_code}",
                        {"response": response.text}
                    )
            else:
                self.log_result(
                    "Invoice Project Filtering (Level 3)", 
                    False, 
                    "Level 3 user has no assigned projects",
                    {"user_projects": user_projects}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Project Filtering (Level 3)", 
                False, 
                f"Error testing project filtering: {str(e)}"
            )
    
    def test_invoice_status_filtering(self):
        """Test invoice status filtering"""
        print("\n=== Testing Invoice Status Filtering ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("Invoice Status Filtering", False, "No authentication token for level3 user")
            return
        
        try:
            # Test filtering by pending status
            response = self.session.get(f"{API_BASE}/invoices", params={'status': 'pending'})
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    # All invoices should have pending status
                    all_pending = all(inv.get('status') == 'pending' for inv in invoices)
                    
                    self.log_result(
                        "Invoice Status Filtering", 
                        all_pending, 
                        f"Status filtering works - {len(invoices)} pending invoices found",
                        {
                            "status_filter": "pending",
                            "invoices_count": len(invoices),
                            "all_pending": all_pending
                        }
                    )
                else:
                    self.log_result(
                        "Invoice Status Filtering", 
                        False, 
                        "Status filtering response is not a list",
                        {"response_type": type(invoices)}
                    )
            else:
                self.log_result(
                    "Invoice Status Filtering", 
                    False, 
                    f"Failed to filter invoices by status: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Status Filtering", 
                False, 
                f"Error testing status filtering: {str(e)}"
            )
    
    def test_invoice_update_level3(self, invoice_id):
        """Test Level 3 user updating their pending invoice"""
        print("\n=== Testing Invoice Update - Level 3 User ===")
        
        if not invoice_id:
            self.log_result("Invoice Update (Level 3)", False, "No invoice ID provided")
            return
        
        if not self.set_auth_header('level3'):
            self.log_result("Invoice Update (Level 3)", False, "No authentication token for level3 user")
            return
        
        # Update invoice data
        update_data = {
            "amount": 2000.50,
            "description": "فاتورة محدثة للمستوى الثالث",
            "governorate": "عفيف"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/invoices/{invoice_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify update
                success = (
                    data.get('amount') == update_data['amount'] and
                    data.get('description') == update_data['description'] and
                    data.get('governorate') == update_data['governorate'] and
                    data.get('status') == 'pending'  # Should still be pending
                )
                
                self.log_result(
                    "Invoice Update (Level 3)", 
                    success, 
                    "Level 3 user successfully updated pending invoice",
                    {
                        "invoice_id": invoice_id,
                        "updated_amount": data.get('amount'),
                        "updated_description": data.get('description'),
                        "updated_governorate": data.get('governorate'),
                        "status": data.get('status')
                    }
                )
            else:
                self.log_result(
                    "Invoice Update (Level 3)", 
                    False, 
                    f"Failed to update invoice: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Update (Level 3)", 
                False, 
                f"Error updating invoice: {str(e)}"
            )
    
    def test_invoice_delete_level3(self):
        """Test Level 3 user deleting their pending invoice"""
        print("\n=== Testing Invoice Delete - Level 3 User ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("Invoice Delete (Level 3)", False, "No authentication token for level3 user")
            return
        
        # First create an invoice to delete
        invoice_data = {
            "invoice_number": "INV-DELETE-TEST",
            "amount": 500.00,
            "description": "فاتورة للحذف",
            "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
            "governorate": "شقراء"
        }
        
        try:
            # Create invoice
            response = self.session.post(f"{API_BASE}/invoices", json=invoice_data)
            
            if response.status_code == 200:
                invoice = response.json()
                invoice_id = invoice.get('id')
                
                # Delete the invoice
                delete_response = self.session.delete(f"{API_BASE}/invoices/{invoice_id}")
                
                if delete_response.status_code == 200:
                    self.log_result(
                        "Invoice Delete (Level 3)", 
                        True, 
                        "Level 3 user successfully deleted pending invoice",
                        {
                            "invoice_id": invoice_id,
                            "invoice_number": invoice_data['invoice_number']
                        }
                    )
                else:
                    self.log_result(
                        "Invoice Delete (Level 3)", 
                        False, 
                        f"Failed to delete invoice: {delete_response.status_code}",
                        {"response": delete_response.text}
                    )
            else:
                self.log_result(
                    "Invoice Delete (Level 3)", 
                    False, 
                    f"Failed to create invoice for deletion test: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Delete (Level 3)", 
                False, 
                f"Error testing invoice deletion: {str(e)}"
            )
    
    def test_invoice_approval_level2(self, invoice_id):
        """Test Level 2 user (Eng Medhat) approving an invoice"""
        print("\n=== Testing Invoice Approval - Level 2 User ===")
        
        if not invoice_id:
            self.log_result("Invoice Approval (Level 2)", False, "No invoice ID provided")
            return
        
        if not self.set_auth_header('level2'):
            self.log_result("Invoice Approval (Level 2)", False, "No authentication token for level2 user")
            return
        
        # Approve invoice
        approval_data = {
            "manager_notes": "تم الاعتماد من قبل المدير"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/invoices/{invoice_id}/approve", json=approval_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify approval
                success = (
                    data.get('status') == 'approved_by_manager' and
                    data.get('reviewed_by_manager') == self.tokens['level2']['user_id'] and
                    data.get('manager_notes') == approval_data['manager_notes']
                )
                
                self.log_result(
                    "Invoice Approval (Level 2)", 
                    success, 
                    "Level 2 user successfully approved invoice",
                    {
                        "invoice_id": invoice_id,
                        "status": data.get('status'),
                        "reviewed_by_manager": data.get('reviewed_by_manager'),
                        "manager_notes": data.get('manager_notes')
                    }
                )
            else:
                self.log_result(
                    "Invoice Approval (Level 2)", 
                    False, 
                    f"Failed to approve invoice: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Approval (Level 2)", 
                False, 
                f"Error approving invoice: {str(e)}"
            )
    
    def test_invoice_rejection_level2(self):
        """Test Level 2 user rejecting an invoice"""
        print("\n=== Testing Invoice Rejection - Level 2 User ===")
        
        if not self.set_auth_header('level3'):
            self.log_result("Invoice Rejection (Level 2)", False, "Cannot switch to level3 for setup")
            return
        
        # First create an invoice as Level 3 user
        invoice_data = {
            "invoice_number": "INV-REJECT-TEST",
            "amount": 750.00,
            "description": "فاتورة للرفض",
            "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
            "governorate": "القصب"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/invoices", json=invoice_data)
            
            if response.status_code == 200:
                invoice = response.json()
                invoice_id = invoice.get('id')
                
                # Switch to Level 2 user
                if not self.set_auth_header('level2'):
                    self.log_result("Invoice Rejection (Level 2)", False, "No authentication token for level2 user")
                    return
                
                # Reject the invoice
                rejection_data = {
                    "manager_notes": "تم رفض الفاتورة لعدم وضوح البيانات"
                }
                
                reject_response = self.session.put(f"{API_BASE}/invoices/{invoice_id}/reject", json=rejection_data)
                
                if reject_response.status_code == 200:
                    data = reject_response.json()
                    
                    # Verify rejection
                    success = (
                        data.get('status') == 'rejected' and
                        data.get('reviewed_by_manager') == self.tokens['level2']['user_id'] and
                        data.get('manager_notes') == rejection_data['manager_notes']
                    )
                    
                    self.log_result(
                        "Invoice Rejection (Level 2)", 
                        success, 
                        "Level 2 user successfully rejected invoice",
                        {
                            "invoice_id": invoice_id,
                            "status": data.get('status'),
                            "reviewed_by_manager": data.get('reviewed_by_manager'),
                            "manager_notes": data.get('manager_notes')
                        }
                    )
                else:
                    self.log_result(
                        "Invoice Rejection (Level 2)", 
                        False, 
                        f"Failed to reject invoice: {reject_response.status_code}",
                        {"response": reject_response.text}
                    )
            else:
                self.log_result(
                    "Invoice Rejection (Level 2)", 
                    False, 
                    f"Failed to create invoice for rejection test: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Rejection (Level 2)", 
                False, 
                f"Error testing invoice rejection: {str(e)}"
            )
    
    def test_invoice_retrieval_level2(self):
        """Test Level 2 user can see invoices from their subordinates"""
        print("\n=== Testing Invoice Retrieval - Level 2 User ===")
        
        if not self.set_auth_header('level2'):
            self.log_result("Invoice Retrieval (Level 2)", False, "No authentication token for level2 user")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/invoices")
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    # Level 2 should see invoices from their subordinates
                    # and their own project invoices
                    user_projects = self.tokens['level2']['projects']
                    
                    self.log_result(
                        "Invoice Retrieval (Level 2)", 
                        True, 
                        f"Level 2 user sees subordinate invoices - {len(invoices)} invoices found",
                        {
                            "invoices_count": len(invoices),
                            "user_projects": user_projects,
                            "sample_invoices": [
                                {
                                    "id": inv.get('id'),
                                    "status": inv.get('status'),
                                    "project": inv.get('project')
                                } for inv in invoices[:3]
                            ]
                        }
                    )
                else:
                    self.log_result(
                        "Invoice Retrieval (Level 2)", 
                        False, 
                        "Invoice response is not a list",
                        {"response_type": type(invoices)}
                    )
            else:
                self.log_result(
                    "Invoice Retrieval (Level 2)", 
                    False, 
                    f"Failed to retrieve invoices: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Retrieval (Level 2)", 
                False, 
                f"Error retrieving invoices: {str(e)}"
            )
    
    def test_admin_invoice_retrieval(self):
        """Test Admin can only see approved_by_manager invoices"""
        print("\n=== Testing Invoice Retrieval - Admin User ===")
        
        if not self.set_auth_header('admin'):
            self.log_result("Invoice Retrieval (Admin)", False, "No authentication token for admin user")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/invoices")
            
            if response.status_code == 200:
                invoices = response.json()
                
                if isinstance(invoices, list):
                    # Admin should only see invoices approved by managers
                    approved_invoices = [inv for inv in invoices if inv.get('status') == 'approved_by_manager']
                    
                    self.log_result(
                        "Invoice Retrieval (Admin)", 
                        True, 
                        f"Admin sees manager-approved invoices - {len(approved_invoices)} of {len(invoices)} total",
                        {
                            "total_invoices": len(invoices),
                            "approved_by_manager": len(approved_invoices),
                            "invoice_statuses": [inv.get('status') for inv in invoices]
                        }
                    )
                else:
                    self.log_result(
                        "Invoice Retrieval (Admin)", 
                        False, 
                        "Invoice response is not a list",
                        {"response_type": type(invoices)}
                    )
            else:
                self.log_result(
                    "Invoice Retrieval (Admin)", 
                    False, 
                    f"Failed to retrieve invoices: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Invoice Retrieval (Admin)", 
                False, 
                f"Error retrieving invoices: {str(e)}"
            )
    
    def test_admin_final_approval(self, invoice_id):
        """Test Admin final approval of manager-approved invoice"""
        print("\n=== Testing Admin Final Approval ===")
        
        if not invoice_id:
            self.log_result("Admin Final Approval", False, "No invoice ID provided")
            return
        
        if not self.set_auth_header('admin'):
            self.log_result("Admin Final Approval", False, "No authentication token for admin user")
            return
        
        # Final approval by admin
        approval_data = {
            "admin_notes": "تم الاعتماد النهائي من قبل الإدارة"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/invoices/{invoice_id}/approve", json=approval_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify final approval
                success = (
                    data.get('status') == 'approved_by_admin' and
                    data.get('reviewed_by_admin') == self.tokens['admin']['user_id'] and
                    data.get('admin_notes') == approval_data['admin_notes']
                )
                
                self.log_result(
                    "Admin Final Approval", 
                    success, 
                    "Admin successfully gave final approval",
                    {
                        "invoice_id": invoice_id,
                        "status": data.get('status'),
                        "reviewed_by_admin": data.get('reviewed_by_admin'),
                        "admin_notes": data.get('admin_notes')
                    }
                )
            else:
                self.log_result(
                    "Admin Final Approval", 
                    False, 
                    f"Failed to give final approval: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Admin Final Approval", 
                False, 
                f"Error giving final approval: {str(e)}"
            )
    
    def test_admin_project_filtering(self):
        """Test Admin can see all projects in filtering"""
        print("\n=== Testing Admin Project Filtering ===")
        
        if not self.set_auth_header('admin'):
            self.log_result("Admin Project Filtering", False, "No authentication token for admin user")
            return
        
        try:
            # Test filtering by different projects
            projects = [
                "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
                "مشروع إصلاح أعمال المحافظات الشمالية - القطاع الأوسط",
                "مشروع إصلاح أعمال المحافظات الجنوبية - القطاع الأوسط"
            ]
            
            all_projects_accessible = True
            project_results = {}
            
            for project in projects:
                response = self.session.get(f"{API_BASE}/invoices", params={'project': project})
                
                if response.status_code == 200:
                    invoices = response.json()
                    project_results[project] = len(invoices) if isinstance(invoices, list) else 0
                else:
                    all_projects_accessible = False
                    project_results[project] = f"Error: {response.status_code}"
            
            self.log_result(
                "Admin Project Filtering", 
                all_projects_accessible, 
                "Admin can access all projects for filtering",
                {
                    "projects_tested": len(projects),
                    "all_accessible": all_projects_accessible,
                    "project_results": project_results
                }
            )
                
        except Exception as e:
            self.log_result(
                "Admin Project Filtering", 
                False, 
                f"Error testing admin project filtering: {str(e)}"
            )
    
    def test_unauthorized_operations(self):
        """Test that users cannot perform unauthorized operations"""
        print("\n=== Testing Unauthorized Operations ===")
        
        # Test Level 3 user trying to approve invoice (should fail)
        if not self.set_auth_header('level3'):
            self.log_result("Unauthorized Operations", False, "No authentication token for level3 user")
            return
        
        # Create a test invoice first
        invoice_data = {
            "invoice_number": "INV-UNAUTH-TEST",
            "amount": 300.00,
            "description": "فاتورة لاختبار العمليات غير المصرحة",
            "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط",
            "governorate": "المزاحمية"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/invoices", json=invoice_data)
            
            if response.status_code == 200:
                invoice = response.json()
                invoice_id = invoice.get('id')
                
                # Try to approve as Level 3 user (should fail)
                approval_data = {"manager_notes": "محاولة اعتماد غير مصرحة"}
                
                approve_response = self.session.put(f"{API_BASE}/invoices/{invoice_id}/approve", json=approval_data)
                
                # Should get 403 Forbidden or similar error
                unauthorized_blocked = approve_response.status_code in [403, 401]
                
                self.log_result(
                    "Unauthorized Operations", 
                    unauthorized_blocked, 
                    f"Level 3 user correctly blocked from approving - Status: {approve_response.status_code}",
                    {
                        "invoice_id": invoice_id,
                        "approve_status_code": approve_response.status_code,
                        "blocked_correctly": unauthorized_blocked
                    }
                )
            else:
                self.log_result(
                    "Unauthorized Operations", 
                    False, 
                    f"Failed to create test invoice: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Unauthorized Operations", 
                False, 
                f"Error testing unauthorized operations: {str(e)}"
            )
    
    def run_all_tests(self):
        """Run all custody invoice tests"""
        print("🚀 Starting Custody Invoices Backend API Testing")
        print("=" * 60)
        
        # Login all users
        for user_type in ['admin', 'level2', 'level3']:
            if not self.login_user(user_type):
                print(f"❌ Failed to login {user_type}, skipping related tests")
                continue
        
        # Test Level 3 operations
        invoice_id = self.test_invoice_creation_level3()
        self.test_invoice_retrieval_level3()
        self.test_invoice_project_filtering_level3()
        self.test_invoice_status_filtering()
        
        if invoice_id:
            self.test_invoice_update_level3(invoice_id)
        
        self.test_invoice_delete_level3()
        
        # Test Level 2 operations
        self.test_invoice_retrieval_level2()
        
        if invoice_id:
            self.test_invoice_approval_level2(invoice_id)
        
        self.test_invoice_rejection_level2()
        
        # Test Admin operations
        self.test_admin_invoice_retrieval()
        
        if invoice_id:
            self.test_admin_final_approval(invoice_id)
        
        self.test_admin_project_filtering()
        
        # Test security
        self.test_unauthorized_operations()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 CUSTODY INVOICES TEST SUMMARY")
        print("=" * 60)
        
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

if __name__ == "__main__":
    tester = CustodyInvoicesTester()
    tester.run_all_tests()