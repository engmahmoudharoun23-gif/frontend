#!/usr/bin/env python3
"""
Export Testing for WFM Report Management System
Tests PDF and Excel export endpoints after recent fixes
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

class ExportTester:
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
        """Login with admin credentials"""
        print("\n=== Authenticating ===")
        
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
                
                self.log_result(
                    "Authentication", 
                    True, 
                    "Successfully logged in as admin",
                    {"user_role": data.get('user', {}).get('role')}
                )
                return True
            else:
                self.log_result(
                    "Authentication", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Authentication", 
                False, 
                f"Login request failed: {str(e)}"
            )
            return False
    
    def test_pdf_export(self):
        """Test PDF export endpoint after Arabic font fix"""
        print("\n=== Testing PDF Export ===")
        
        if not self.auth_token:
            self.log_result("PDF Export", False, "No authentication token available")
            return
        
        try:
            # Test PDF export endpoint
            response = self.session.get(f"{API_BASE}/reports/export/pdf", timeout=30)
            
            if response.status_code == 200:
                # Check if response is actually a PDF
                content_type = response.headers.get('content-type', '')
                content_disposition = response.headers.get('content-disposition', '')
                
                is_pdf = (
                    'application/pdf' in content_type or 
                    'reports.pdf' in content_disposition or
                    response.content.startswith(b'%PDF')
                )
                
                if is_pdf:
                    self.log_result(
                        "PDF Export", 
                        True, 
                        "PDF export successful - no 500 errors, PDF file returned",
                        {
                            "status_code": response.status_code,
                            "content_type": content_type,
                            "content_disposition": content_disposition,
                            "content_size_bytes": len(response.content)
                        }
                    )
                else:
                    self.log_result(
                        "PDF Export", 
                        False, 
                        "Response received but not a valid PDF file",
                        {
                            "status_code": response.status_code,
                            "content_type": content_type,
                            "content_start": response.content[:50]
                        }
                    )
            else:
                # Check if it's a 500 error specifically
                is_500_error = response.status_code == 500
                
                self.log_result(
                    "PDF Export", 
                    False, 
                    f"PDF export failed with status {response.status_code}" + (" (500 Internal Server Error)" if is_500_error else ""),
                    {
                        "status_code": response.status_code,
                        "response": response.text[:500] if response.text else "No response text",
                        "is_500_error": is_500_error
                    }
                )
                
        except Exception as e:
            self.log_result(
                "PDF Export", 
                False, 
                f"PDF export request failed: {str(e)}"
            )
    
    def test_excel_export(self):
        """Test Excel export endpoint after Border import fix"""
        print("\n=== Testing Excel Export ===")
        
        if not self.auth_token:
            self.log_result("Excel Export", False, "No authentication token available")
            return
        
        try:
            # Test Excel export endpoint
            response = self.session.get(f"{API_BASE}/reports/export/excel", timeout=30)
            
            if response.status_code == 200:
                # Check if response is actually an Excel file
                content_type = response.headers.get('content-type', '')
                content_disposition = response.headers.get('content-disposition', '')
                
                is_excel = (
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in content_type or
                    'reports.xlsx' in content_disposition or
                    response.content.startswith(b'PK')  # Excel files start with PK (ZIP signature)
                )
                
                if is_excel:
                    self.log_result(
                        "Excel Export", 
                        True, 
                        "Excel export successful - no 500 errors, Excel file returned",
                        {
                            "status_code": response.status_code,
                            "content_type": content_type,
                            "content_disposition": content_disposition,
                            "content_size_bytes": len(response.content)
                        }
                    )
                else:
                    self.log_result(
                        "Excel Export", 
                        False, 
                        "Response received but not a valid Excel file",
                        {
                            "status_code": response.status_code,
                            "content_type": content_type,
                            "content_start": response.content[:50]
                        }
                    )
            else:
                # Check if it's a 500 error specifically
                is_500_error = response.status_code == 500
                
                self.log_result(
                    "Excel Export", 
                    False, 
                    f"Excel export failed with status {response.status_code}" + (" (500 Internal Server Error)" if is_500_error else ""),
                    {
                        "status_code": response.status_code,
                        "response": response.text[:500] if response.text else "No response text",
                        "is_500_error": is_500_error
                    }
                )
                
        except Exception as e:
            self.log_result(
                "Excel Export", 
                False, 
                f"Excel export request failed: {str(e)}"
            )
    
    def run_export_tests(self):
        """Run all export tests"""
        print("🚀 Starting Export Tests for WFM Report Management System")
        print(f"Backend URL: {BACKEND_URL}")
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed - cannot proceed with tests")
            return
        
        # Run export tests
        self.test_pdf_export()
        self.test_excel_export()
        
        # Print summary
        print("\n" + "="*60)
        print("📊 EXPORT TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        print(f"\n📈 Results: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
        
        if passed == total:
            print("🎉 All export tests passed!")
        else:
            print("⚠️  Some export tests failed - check details above")
        
        return self.test_results

if __name__ == "__main__":
    tester = ExportTester()
    results = tester.run_export_tests()