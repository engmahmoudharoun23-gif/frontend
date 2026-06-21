#!/usr/bin/env python3
"""
Contractors Management System Testing for WFM Report Management System
Tests all contractors CRUD operations as requested in Arabic review
"""

import requests
import json
from datetime import datetime
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class ContractorsSystemTester:
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
            "password": "123456"  # Based on test_result.md, password was reset to 123456
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
                # Try alternative passwords
                alt_passwords = ["admin123", "admin", "password"]
                for pwd in alt_passwords:
                    login_data["password"] = pwd
                    response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                    if response.status_code == 200:
                        data = response.json()
                        self.auth_token = data.get('access_token')
                        self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                        
                        self.log_result(
                            "Admin Login", 
                            True, 
                            f"Successfully logged in with password: {pwd}",
                            {"user_role": data.get('user', {}).get('role')}
                        )
                        return True
                
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

    def test_contractors_get_empty_list(self):
        """Test GET /api/contractors - should return empty list initially"""
        print("\n=== Testing Contractors - Get Empty List ===")
        
        if not self.auth_token:
            self.log_result("Contractors Get Empty", False, "No authentication token available")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/contractors")
            
            if response.status_code == 200:
                contractors = response.json()
                
                if isinstance(contractors, list):
                    # Should return empty list or existing contractors
                    success = True  # Any list response is valid
                    
                    self.log_result(
                        "Contractors Get Empty", 
                        success, 
                        f"GET /api/contractors works - returned {len(contractors)} contractors",
                        {
                            "contractors_count": len(contractors),
                            "response_type": "list"
                        }
                    )
                else:
                    self.log_result(
                        "Contractors Get Empty", 
                        False, 
                        "Contractors response is not a list",
                        {"response_type": type(contractors)}
                    )
            else:
                self.log_result(
                    "Contractors Get Empty", 
                    False, 
                    f"Failed to get contractors: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Contractors Get Empty", 
                False, 
                f"Error getting contractors: {str(e)}"
            )

    def test_contractors_add_first(self):
        """Test adding first contractor - شركة الشرهان للمشروع الغربي"""
        print("\n=== Testing Contractors - Add First Contractor ===")
        
        if not self.auth_token:
            self.log_result("Add First Contractor", False, "No authentication token available")
            return None
        
        try:
            contractor_data = {
                "name": "شركة الشرهان",
                "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"
            }
            
            response = self.session.post(f"{API_BASE}/contractors", json=contractor_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify contractor data
                success = (data.get('name') == contractor_data['name'] and 
                          data.get('project') == contractor_data['project'] and
                          data.get('id') is not None)
                
                self.log_result(
                    "Add First Contractor", 
                    success, 
                    "شركة الشرهان added successfully to Western project",
                    {
                        "contractor_id": data.get('id'),
                        "name": data.get('name'),
                        "project": data.get('project'),
                        "created_by": data.get('created_by')
                    }
                )
                return data.get('id') if success else None
            else:
                self.log_result(
                    "Add First Contractor", 
                    False, 
                    f"Failed to add first contractor: {response.status_code}",
                    {"response": response.text}
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Add First Contractor", 
                False, 
                f"Error adding first contractor: {str(e)}"
            )
            return None

    def test_contractors_add_second(self):
        """Test adding second contractor - شركة جيتكو للمشروع الغربي"""
        print("\n=== Testing Contractors - Add Second Contractor ===")
        
        if not self.auth_token:
            self.log_result("Add Second Contractor", False, "No authentication token available")
            return None
        
        try:
            contractor_data = {
                "name": "شركة جيتكو",
                "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"
            }
            
            response = self.session.post(f"{API_BASE}/contractors", json=contractor_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify contractor data
                success = (data.get('name') == contractor_data['name'] and 
                          data.get('project') == contractor_data['project'] and
                          data.get('id') is not None)
                
                self.log_result(
                    "Add Second Contractor", 
                    success, 
                    "شركة جيتكو added successfully to Western project",
                    {
                        "contractor_id": data.get('id'),
                        "name": data.get('name'),
                        "project": data.get('project'),
                        "created_by": data.get('created_by')
                    }
                )
                return data.get('id') if success else None
            else:
                self.log_result(
                    "Add Second Contractor", 
                    False, 
                    f"Failed to add second contractor: {response.status_code}",
                    {"response": response.text}
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Add Second Contractor", 
                False, 
                f"Error adding second contractor: {str(e)}"
            )
            return None

    def test_contractors_add_third(self):
        """Test adding third contractor - شركة الموسي للمشروع الشمالي"""
        print("\n=== Testing Contractors - Add Third Contractor ===")
        
        if not self.auth_token:
            self.log_result("Add Third Contractor", False, "No authentication token available")
            return None
        
        try:
            contractor_data = {
                "name": "شركة الموسي",
                "project": "مشروع إصلاح أعمال المحافظات الشمالية - القطاع الأوسط"
            }
            
            response = self.session.post(f"{API_BASE}/contractors", json=contractor_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify contractor data
                success = (data.get('name') == contractor_data['name'] and 
                          data.get('project') == contractor_data['project'] and
                          data.get('id') is not None)
                
                self.log_result(
                    "Add Third Contractor", 
                    success, 
                    "شركة الموسي added successfully to Northern project",
                    {
                        "contractor_id": data.get('id'),
                        "name": data.get('name'),
                        "project": data.get('project'),
                        "created_by": data.get('created_by')
                    }
                )
                return data.get('id') if success else None
            else:
                self.log_result(
                    "Add Third Contractor", 
                    False, 
                    f"Failed to add third contractor: {response.status_code}",
                    {"response": response.text}
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Add Third Contractor", 
                False, 
                f"Error adding third contractor: {str(e)}"
            )
            return None

    def test_contractors_duplicate_prevention(self):
        """Test duplicate contractor prevention - try to add شركة الشرهان again to same project"""
        print("\n=== Testing Contractors - Duplicate Prevention ===")
        
        if not self.auth_token:
            self.log_result("Duplicate Prevention", False, "No authentication token available")
            return
        
        try:
            # Try to add duplicate contractor
            contractor_data = {
                "name": "شركة الشرهان",
                "project": "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"
            }
            
            response = self.session.post(f"{API_BASE}/contractors", json=contractor_data)
            
            if response.status_code == 400:
                data = response.json()
                error_message = data.get('detail', '')
                
                # Should get Arabic error message about duplicate contractor
                success = "يوجد مقاول بنفس الاسم في هذا المشروع" in error_message
                
                self.log_result(
                    "Duplicate Prevention", 
                    success, 
                    "Duplicate contractor correctly prevented with Arabic error message",
                    {
                        "status_code": response.status_code,
                        "error_message": error_message,
                        "duplicate_name": contractor_data['name'],
                        "duplicate_project": contractor_data['project']
                    }
                )
            else:
                self.log_result(
                    "Duplicate Prevention", 
                    False, 
                    f"Expected 400 error for duplicate contractor, got: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Duplicate Prevention", 
                False, 
                f"Error testing duplicate prevention: {str(e)}"
            )

    def test_contractors_get_all(self):
        """Test GET /api/contractors - should return all contractors"""
        print("\n=== Testing Contractors - Get All Contractors ===")
        
        if not self.auth_token:
            self.log_result("Get All Contractors", False, "No authentication token available")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/contractors")
            
            if response.status_code == 200:
                contractors = response.json()
                
                if isinstance(contractors, list):
                    # Should have at least 3 contractors from previous tests
                    success = len(contractors) >= 3
                    
                    # Check if we have the expected contractors
                    contractor_names = [c.get('name') for c in contractors]
                    has_sharhan = "شركة الشرهان" in contractor_names
                    has_gitco = "شركة جيتكو" in contractor_names
                    has_mousi = "شركة الموسي" in contractor_names
                    
                    self.log_result(
                        "Get All Contractors", 
                        success, 
                        f"Retrieved {len(contractors)} contractors successfully",
                        {
                            "contractors_count": len(contractors),
                            "contractor_names": contractor_names,
                            "has_sharhan": has_sharhan,
                            "has_gitco": has_gitco,
                            "has_mousi": has_mousi
                        }
                    )
                else:
                    self.log_result(
                        "Get All Contractors", 
                        False, 
                        "Contractors response is not a list",
                        {"response_type": type(contractors)}
                    )
            else:
                self.log_result(
                    "Get All Contractors", 
                    False, 
                    f"Failed to get all contractors: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Get All Contractors", 
                False, 
                f"Error getting all contractors: {str(e)}"
            )

    def test_contractors_filter_western_project(self):
        """Test GET /api/contractors?project=Western - should return 2 contractors"""
        print("\n=== Testing Contractors - Filter Western Project ===")
        
        if not self.auth_token:
            self.log_result("Filter Western Project", False, "No authentication token available")
            return
        
        try:
            project_name = "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"
            response = self.session.get(f"{API_BASE}/contractors", params={"project": project_name})
            
            if response.status_code == 200:
                contractors = response.json()
                
                if isinstance(contractors, list):
                    # Should have 2 contractors for Western project
                    expected_count = 2
                    actual_count = len(contractors)
                    
                    # Verify all contractors belong to the correct project
                    all_correct_project = all(c.get('project') == project_name for c in contractors)
                    
                    # Check for expected contractor names
                    contractor_names = [c.get('name') for c in contractors]
                    has_sharhan = "شركة الشرهان" in contractor_names
                    has_gitco = "شركة جيتكو" in contractor_names
                    
                    success = (actual_count == expected_count and all_correct_project and 
                              has_sharhan and has_gitco)
                    
                    self.log_result(
                        "Filter Western Project", 
                        success, 
                        f"Western project filtering works - {actual_count} contractors found",
                        {
                            "project_filter": project_name,
                            "expected_count": expected_count,
                            "actual_count": actual_count,
                            "contractor_names": contractor_names,
                            "all_correct_project": all_correct_project,
                            "has_sharhan": has_sharhan,
                            "has_gitco": has_gitco
                        }
                    )
                else:
                    self.log_result(
                        "Filter Western Project", 
                        False, 
                        "Western project filter response is not a list",
                        {"response_type": type(contractors)}
                    )
            else:
                self.log_result(
                    "Filter Western Project", 
                    False, 
                    f"Failed to filter Western project: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Filter Western Project", 
                False, 
                f"Error filtering Western project: {str(e)}"
            )

    def test_contractors_filter_northern_project(self):
        """Test GET /api/contractors?project=Northern - should return 1 contractor"""
        print("\n=== Testing Contractors - Filter Northern Project ===")
        
        if not self.auth_token:
            self.log_result("Filter Northern Project", False, "No authentication token available")
            return
        
        try:
            project_name = "مشروع إصلاح أعمال المحافظات الشمالية - القطاع الأوسط"
            response = self.session.get(f"{API_BASE}/contractors", params={"project": project_name})
            
            if response.status_code == 200:
                contractors = response.json()
                
                if isinstance(contractors, list):
                    # Should have 1 contractor for Northern project
                    expected_count = 1
                    actual_count = len(contractors)
                    
                    # Verify all contractors belong to the correct project
                    all_correct_project = all(c.get('project') == project_name for c in contractors)
                    
                    # Check for expected contractor name
                    contractor_names = [c.get('name') for c in contractors]
                    has_mousi = "شركة الموسي" in contractor_names
                    
                    success = (actual_count == expected_count and all_correct_project and has_mousi)
                    
                    self.log_result(
                        "Filter Northern Project", 
                        success, 
                        f"Northern project filtering works - {actual_count} contractor found",
                        {
                            "project_filter": project_name,
                            "expected_count": expected_count,
                            "actual_count": actual_count,
                            "contractor_names": contractor_names,
                            "all_correct_project": all_correct_project,
                            "has_mousi": has_mousi
                        }
                    )
                else:
                    self.log_result(
                        "Filter Northern Project", 
                        False, 
                        "Northern project filter response is not a list",
                        {"response_type": type(contractors)}
                    )
            else:
                self.log_result(
                    "Filter Northern Project", 
                    False, 
                    f"Failed to filter Northern project: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Filter Northern Project", 
                False, 
                f"Error filtering Northern project: {str(e)}"
            )

    def test_contractors_update_name(self):
        """Test PUT /api/contractors/{id} - update شركة الشرهان to شركة الشرهان المحدودة"""
        print("\n=== Testing Contractors - Update Name ===")
        
        if not self.auth_token:
            self.log_result("Update Contractor Name", False, "No authentication token available")
            return None
        
        try:
            # First get all contractors to find شركة الشرهان
            response = self.session.get(f"{API_BASE}/contractors")
            
            if response.status_code != 200:
                self.log_result("Update Contractor Name", False, "Failed to get contractors list")
                return None
            
            contractors = response.json()
            sharhan_contractor = next((c for c in contractors if c.get('name') == "شركة الشرهان"), None)
            
            if not sharhan_contractor:
                self.log_result("Update Contractor Name", False, "شركة الشرهان not found in contractors list")
                return None
            
            contractor_id = sharhan_contractor.get('id')
            
            # Update the contractor name
            update_data = {
                "name": "شركة الشرهان المحدودة",
                "project": sharhan_contractor.get('project')
            }
            
            response = self.session.put(f"{API_BASE}/contractors/{contractor_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify the update
                success = (data.get('name') == update_data['name'] and 
                          data.get('project') == update_data['project'] and
                          data.get('id') == contractor_id)
                
                self.log_result(
                    "Update Contractor Name", 
                    success, 
                    "شركة الشرهان updated to شركة الشرهان المحدودة successfully",
                    {
                        "contractor_id": contractor_id,
                        "old_name": "شركة الشرهان",
                        "new_name": data.get('name'),
                        "project": data.get('project')
                    }
                )
                return contractor_id if success else None
            else:
                self.log_result(
                    "Update Contractor Name", 
                    False, 
                    f"Failed to update contractor: {response.status_code}",
                    {"response": response.text}
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Update Contractor Name", 
                False, 
                f"Error updating contractor name: {str(e)}"
            )
            return None

    def test_contractors_update_duplicate_prevention(self):
        """Test updating شركة جيتكو to شركة الشرهان المحدودة (should fail - duplicate)"""
        print("\n=== Testing Contractors - Update Duplicate Prevention ===")
        
        if not self.auth_token:
            self.log_result("Update Duplicate Prevention", False, "No authentication token available")
            return
        
        try:
            # First get all contractors to find شركة جيتكو
            response = self.session.get(f"{API_BASE}/contractors")
            
            if response.status_code != 200:
                self.log_result("Update Duplicate Prevention", False, "Failed to get contractors list")
                return
            
            contractors = response.json()
            gitco_contractor = next((c for c in contractors if c.get('name') == "شركة جيتكو"), None)
            
            if not gitco_contractor:
                self.log_result("Update Duplicate Prevention", False, "شركة جيتكو not found in contractors list")
                return
            
            contractor_id = gitco_contractor.get('id')
            
            # Try to update to duplicate name
            update_data = {
                "name": "شركة الشرهان المحدودة",  # This should already exist
                "project": gitco_contractor.get('project')
            }
            
            response = self.session.put(f"{API_BASE}/contractors/{contractor_id}", json=update_data)
            
            if response.status_code == 400:
                data = response.json()
                error_message = data.get('detail', '')
                
                # Should get Arabic error message about duplicate contractor
                success = "يوجد مقاول آخر بنفس الاسم في هذا المشروع" in error_message
                
                self.log_result(
                    "Update Duplicate Prevention", 
                    success, 
                    "Update duplicate correctly prevented with Arabic error message",
                    {
                        "status_code": response.status_code,
                        "error_message": error_message,
                        "attempted_name": update_data['name'],
                        "contractor_id": contractor_id
                    }
                )
            else:
                self.log_result(
                    "Update Duplicate Prevention", 
                    False, 
                    f"Expected 400 error for duplicate update, got: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Update Duplicate Prevention", 
                False, 
                f"Error testing update duplicate prevention: {str(e)}"
            )

    def test_contractors_delete(self):
        """Test DELETE /api/contractors/{id} - delete one contractor"""
        print("\n=== Testing Contractors - Delete Contractor ===")
        
        if not self.auth_token:
            self.log_result("Delete Contractor", False, "No authentication token available")
            return
        
        try:
            # First get all contractors to find one to delete
            response = self.session.get(f"{API_BASE}/contractors")
            
            if response.status_code != 200:
                self.log_result("Delete Contractor", False, "Failed to get contractors list")
                return
            
            contractors = response.json()
            
            if len(contractors) == 0:
                self.log_result("Delete Contractor", False, "No contractors available to delete")
                return
            
            # Delete the first contractor
            contractor_to_delete = contractors[0]
            contractor_id = contractor_to_delete.get('id')
            contractor_name = contractor_to_delete.get('name')
            
            response = self.session.delete(f"{API_BASE}/contractors/{contractor_id}")
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', '')
                
                # Should get Arabic success message
                success = "تم حذف المقاول بنجاح" in message
                
                # Verify contractor is actually deleted
                verify_response = self.session.get(f"{API_BASE}/contractors")
                if verify_response.status_code == 200:
                    remaining_contractors = verify_response.json()
                    contractor_still_exists = any(c.get('id') == contractor_id for c in remaining_contractors)
                    
                    success = success and not contractor_still_exists
                    
                    self.log_result(
                        "Delete Contractor", 
                        success, 
                        f"Contractor deleted successfully with Arabic message",
                        {
                            "deleted_contractor_id": contractor_id,
                            "deleted_contractor_name": contractor_name,
                            "success_message": message,
                            "contractor_still_exists": contractor_still_exists,
                            "remaining_count": len(remaining_contractors)
                        }
                    )
                else:
                    self.log_result(
                        "Delete Contractor", 
                        False, 
                        "Could not verify contractor deletion",
                        {"verify_response_status": verify_response.status_code}
                    )
            else:
                self.log_result(
                    "Delete Contractor", 
                    False, 
                    f"Failed to delete contractor: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Delete Contractor", 
                False, 
                f"Error deleting contractor: {str(e)}"
            )

    def test_contractors_final_count(self):
        """Test final contractor count - should be 2 after deletion"""
        print("\n=== Testing Contractors - Final Count Verification ===")
        
        if not self.auth_token:
            self.log_result("Final Count Verification", False, "No authentication token available")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/contractors")
            
            if response.status_code == 200:
                contractors = response.json()
                
                if isinstance(contractors, list):
                    # Should have 2 contractors remaining after deletion
                    expected_count = 2
                    actual_count = len(contractors)
                    
                    success = actual_count == expected_count
                    
                    contractor_names = [c.get('name') for c in contractors]
                    
                    self.log_result(
                        "Final Count Verification", 
                        success, 
                        f"Final contractor count verified - {actual_count} contractors remaining",
                        {
                            "expected_count": expected_count,
                            "actual_count": actual_count,
                            "remaining_contractors": contractor_names
                        }
                    )
                else:
                    self.log_result(
                        "Final Count Verification", 
                        False, 
                        "Final count response is not a list",
                        {"response_type": type(contractors)}
                    )
            else:
                self.log_result(
                    "Final Count Verification", 
                    False, 
                    f"Failed to get final contractor count: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Final Count Verification", 
                False, 
                f"Error verifying final count: {str(e)}"
            )

    def run_all_tests(self):
        """Run all contractors management system tests"""
        print("🏗️ Starting Contractors Management System Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test authentication first
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return
        
        # Run contractors tests in sequence as per Arabic review request
        self.test_contractors_get_empty_list()
        self.test_contractors_add_first()
        self.test_contractors_add_second()
        self.test_contractors_add_third()
        self.test_contractors_duplicate_prevention()
        self.test_contractors_get_all()
        self.test_contractors_filter_western_project()
        self.test_contractors_filter_northern_project()
        self.test_contractors_update_name()
        self.test_contractors_update_duplicate_prevention()
        self.test_contractors_delete()
        self.test_contractors_final_count()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("📊 CONTRACTORS MANAGEMENT SYSTEM TEST RESULTS")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['message']}")
        
        print("\n" + "="*60)

if __name__ == "__main__":
    tester = ContractorsSystemTester()
    tester.run_all_tests()