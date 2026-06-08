"""
Test suite for hierarchical permissions system
"""
import pytest
import requests
import os

BASE_URL = "https://khibra-hub.preview.emergentagent.com"

ADMIN_CREDS = {"username": "admin", "password": "123456"}
LEVEL2_CREDS = {"username": "Eng Medhat Hussien", "password": "123456"}
LEVEL2_ALT_CREDS = {"username": "Mahmoud", "password": "123456"}


class TestAuthAndPermissions:
    """Test authentication and permissions endpoints"""
    
    def test_admin_login_success(self):
        """Test admin login returns valid token and user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"Admin login successful - role: {data['user']['role']}")
    
    def test_level2_login_success(self):
        """Test Level 2 user login returns valid token and user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=LEVEL2_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"Level 2 login successful - permissions count: {len(data['user'].get('permissions', []))}")
    
    def test_level2_alt_login_success(self):
        """Test alternative Level 2 user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=LEVEL2_ALT_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["can_create_subusers"] == True
        print(f"Level 2 alt login successful - can_create_subusers: {data['user']['can_create_subusers']}")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "invalid_user", "password": "wrong_password"
        })
        assert response.status_code == 401
        print("Invalid login correctly rejected")
    
    def test_get_all_permissions(self):
        """Test fetching all available permissions"""
        login = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = login.json()["access_token"]
        response = requests.get(f"{BASE_URL}/api/permissions", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        permissions = response.json()
        assert isinstance(permissions, list)
        assert len(permissions) > 0
        print(f"Fetched {len(permissions)} permissions")
    
    def test_get_users_as_admin(self):
        """Test admin can fetch users list"""
        login = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = login.json()["access_token"]
        response = requests.get(f"{BASE_URL}/api/users", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        print(f"Admin fetched {len(users)} users")
    
    def test_level2_user_has_permissions_array(self):
        """Verify Level 2 user has permissions array"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=LEVEL2_ALT_CREDS)
        user = response.json()["user"]
        assert "permissions" in user
        assert isinstance(user["permissions"], list)
        assert len(user["permissions"]) > 0
        print(f"Level 2 user has {len(user['permissions'])} permissions: {user['permissions'][:5]}...")
    
    def test_admin_can_update_user_permissions(self):
        """Test admin can update user permissions"""
        login = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = login.json()["access_token"]
        users_response = requests.get(f"{BASE_URL}/api/users", headers={"Authorization": f"Bearer {token}"})
        users = users_response.json()
        if len(users) == 0:
            pytest.skip("No users to test")
        target_user = users[0]
        original_perms = target_user.get("permissions", [])
        response = requests.put(
            f"{BASE_URL}/api/users/{target_user['id']}/permissions",
            json={"permissions": original_perms},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        print(f"Admin successfully updated permissions for user {target_user['username']}")
    
    def test_get_projects(self):
        """Test fetching projects list"""
        login = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = login.json()["access_token"]
        response = requests.get(f"{BASE_URL}/api/projects", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        projects = response.json()
        assert isinstance(projects, list)
        print(f"Fetched {len(projects)} projects")
    
    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint returns current user"""
        login = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = login.json()["access_token"]
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        user = response.json()
        assert user["username"] == "admin"
        print("/auth/me endpoint working correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
