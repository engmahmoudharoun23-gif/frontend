#!/usr/bin/env python3
"""
User Update Endpoint Testing for Arabic Review Request
Tests the PUT /api/users/{user_id} endpoint with specific data as requested
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

class UserUpdateTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
        elif details and success:
            print(f"   ✓ {details}")
    
    def test_authentication(self):
        """Test login with admin credentials as specified in Arabic review"""
        print("=== Testing Authentication ===")
        
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
                    f"User role: {data.get('user', {}).get('role')}"
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
    
    def test_user_update_endpoint(self):
        """Test user update endpoint as requested in Arabic review"""
        print("\n=== Testing User Update Endpoint (Arabic Review Request) ===")
        
        if not self.auth_token:
            self.log_result("User Update Test", False, "No authentication token available")
            return
        
        try:
            # Step 1: Get list of users from /api/users
            print("📋 Step 1: Getting list of users...")
            response = self.session.get(f"{API_BASE}/users")
            
            if response.status_code != 200:
                self.log_result(
                    "Get Users List", 
                    False, 
                    f"Failed to get users list: {response.status_code}",
                    {"response": response.text}
                )
                return
            
            users = response.json()
            
            if not isinstance(users, list) or len(users) == 0:
                self.log_result(
                    "Get Users List", 
                    False, 
                    "No users found in the system",
                    {"users_type": type(users), "users_count": len(users) if isinstance(users, list) else 0}
                )
                return
            
            self.log_result(
                "Get Users List", 
                True, 
                f"Successfully retrieved {len(users)} users",
                f"Users found: {[u.get('username') for u in users[:5]]}"  # Show first 5 usernames
            )
            
            # Step 2: Select a user (look for 'midahat' or use first user)
            print("🎯 Step 2: Selecting target user...")
            target_user = None
            
            # First try to find 'midahat' user
            for user in users:
                username = user.get('username', '').lower()
                if username in ['midahat', 'مدحت']:
                    target_user = user
                    print(f"   Found 'midahat' user: {user.get('username')}")
                    break
            
            # If not found, use the first user in the list
            if not target_user:
                target_user = users[0]
                print(f"   Using first user in list: {target_user.get('username')}")
            
            user_id = target_user.get('id')
            original_username = target_user.get('username')
            original_full_name = target_user.get('full_name')
            original_title = target_user.get('title')
            
            self.log_result(
                "Select Target User", 
                True, 
                f"Selected user: {original_username}",
                f"User ID: {user_id}, Full Name: {original_full_name}, Title: {original_title}"
            )
            
            # Step 3: Update user information using PUT /api/users/{user_id}
            print("🔄 Step 3: Updating user information...")
            update_data = {
                "username": "مدحت",
                "full_name": "م / مدحت حسين محمد",
                "title": "المهندس /"
            }
            
            print(f"   Update data: {update_data}")
            
            # Use JSON body format as specified in the review
            response = self.session.put(f"{API_BASE}/users/{user_id}", json=update_data)
            
            if response.status_code == 200:
                update_response = response.json()
                
                # Step 4: Verify the update was successful
                success_message = update_response.get('message', '')
                update_successful = "تم تحديث المستخدم بنجاح" in success_message or "تم تحديث" in success_message
                
                self.log_result(
                    "User Update Request", 
                    update_successful, 
                    "User update request completed",
                    f"Response message: {success_message}"
                )
                
                if update_successful:
                    # Step 5: Retrieve user data again to confirm changes were saved
                    print("✅ Step 4: Verifying changes were saved...")
                    verification_response = self.session.get(f"{API_BASE}/users")
                    
                    if verification_response.status_code == 200:
                        updated_users = verification_response.json()
                        updated_user = next((u for u in updated_users if u.get('id') == user_id), None)
                        
                        if updated_user:
                            # Verify all fields were updated correctly
                            new_username = updated_user.get('username')
                            new_full_name = updated_user.get('full_name')
                            new_title = updated_user.get('title')
                            
                            username_correct = new_username == "مدحت"
                            full_name_correct = new_full_name == "م / مدحت حسين محمد"
                            title_correct = new_title == "المهندس /"
                            
                            all_fields_correct = username_correct and full_name_correct and title_correct
                            
                            print(f"   ✓ Username: '{new_username}' (Expected: 'مدحت') - {'✅' if username_correct else '❌'}")
                            print(f"   ✓ Full Name: '{new_full_name}' (Expected: 'م / مدحت حسين محمد') - {'✅' if full_name_correct else '❌'}")
                            print(f"   ✓ Title: '{new_title}' (Expected: 'المهندس /') - {'✅' if title_correct else '❌'}")
                            
                            self.log_result(
                                "User Update Verification", 
                                all_fields_correct, 
                                "User information updated and verified successfully" if all_fields_correct else "Some fields were not updated correctly",
                                {
                                    "username_updated": username_correct,
                                    "full_name_updated": full_name_correct,
                                    "title_updated": title_correct,
                                    "original_data": {
                                        "username": original_username,
                                        "full_name": original_full_name,
                                        "title": original_title
                                    },
                                    "new_data": {
                                        "username": new_username,
                                        "full_name": new_full_name,
                                        "title": new_title
                                    }
                                }
                            )
                            
                            return all_fields_correct
                        else:
                            self.log_result(
                                "User Update Verification", 
                                False, 
                                "Could not find updated user in users list",
                                {"user_id": user_id}
                            )
                            return False
                    else:
                        self.log_result(
                            "User Update Verification", 
                            False, 
                            f"Failed to retrieve users for verification: {verification_response.status_code}",
                            {"response": verification_response.text}
                        )
                        return False
                else:
                    self.log_result(
                        "User Update Request", 
                        False, 
                        "Update response did not contain success message",
                        {"response_message": success_message, "full_response": update_response}
                    )
                    return False
            else:
                self.log_result(
                    "User Update Request", 
                    False, 
                    f"Failed to update user: {response.status_code}",
                    {"response": response.text, "update_data": update_data}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "User Update Test", 
                False, 
                f"Error testing user update: {str(e)}"
            )
            return False
    
    def run_test(self):
        """Run the user update test as requested in Arabic review"""
        print("🚀 Starting User Update Endpoint Test (Arabic Review Request)")
        print(f"🔗 Backend URL: {API_BASE}")
        print("=" * 80)
        
        # Step 1: Authentication
        if not self.test_authentication():
            print("\n❌ Authentication failed - cannot proceed with user update test")
            return False
        
        # Step 2: Test user update endpoint
        success = self.test_user_update_endpoint()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        if success:
            print("✅ SUCCESS: User update endpoint test completed successfully")
            print("   ✓ Login with admin/123456 credentials: PASSED")
            print("   ✓ Get users list from /api/users: PASSED")
            print("   ✓ Select target user (midahat or first user): PASSED")
            print("   ✓ Update user with PUT /api/users/{user_id}: PASSED")
            print("   ✓ Verify changes were saved to database: PASSED")
            print("\n🎉 All requirements from Arabic review request have been fulfilled!")
        else:
            print("❌ FAILURE: User update endpoint test failed")
            print("   Please check the error messages above for details")
        
        return success

if __name__ == "__main__":
    tester = UserUpdateTester()
    tester.run_test()