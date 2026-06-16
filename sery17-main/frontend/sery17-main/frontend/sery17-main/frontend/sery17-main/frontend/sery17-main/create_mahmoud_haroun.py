#!/usr/bin/env python3
"""
Create Mahmoud Haroun user for review system testing
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

def create_mahmoud_haroun_user():
    """Create mahmoud_haroun user with proper permissions"""
    print("🔧 Creating mahmoud_haroun user...")
    
    session = requests.Session()
    
    # First login as admin
    admin_login = {
        "username": "admin",
        "password": "123456"
    }
    
    try:
        response = session.post(f"{API_BASE}/auth/login", json=admin_login)
        
        if response.status_code == 200:
            admin_data = response.json()
            admin_token = admin_data.get('access_token')
            session.headers.update({'Authorization': f'Bearer {admin_token}'})
            
            print("✅ Admin login successful")
            
            # Create mahmoud_haroun user
            user_data = {
                "username": "mahmoud_haroun",
                "email": "mahmoud.haroun@example.com",
                "full_name": "المهندس محمود هارون",
                "password": "123456",
                "role": "user",
                "governorates": [
                    "الدوادمي", "مرات", "ضرماء", "عفيف", "القصب", 
                    "القويعية", "شقراء", "المزاحمية", "الرين"
                ],
                "projects": ["مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"]
            }
            
            response = session.post(f"{API_BASE}/auth/register", json=user_data)
            
            if response.status_code == 200:
                created_user = response.json()
                print("✅ mahmoud_haroun user created successfully!")
                print(f"   - ID: {created_user.get('id')}")
                print(f"   - Username: {created_user.get('username')}")
                print(f"   - Full Name: {created_user.get('full_name')}")
                print(f"   - Role: {created_user.get('role')}")
                print(f"   - Governorates: {len(created_user.get('governorates', []))} governorates")
                print(f"   - Projects: {created_user.get('projects')}")
                return True
                
            elif response.status_code == 400 and "already exists" in response.text:
                print("ℹ️  mahmoud_haroun user already exists")
                return True
                
            else:
                print(f"❌ Failed to create user: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating user: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_mahmoud_haroun_user()
    if success:
        print("\n🎯 Ready to test mahmoud_haroun review system!")
        print("   Run: python mahmoud_haroun_test.py")
    else:
        print("\n❌ Failed to create mahmoud_haroun user")