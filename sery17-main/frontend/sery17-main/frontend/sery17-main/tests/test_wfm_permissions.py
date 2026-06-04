"""
Test suite for WFM Permissions System - Testing new permissions:
- cars: عرض سيارات المشاريع
- cars_manage: تسليم وإدارة السيارات
- view_all_invoices: عرض جميع الفواتير
- view_all_employee_requests: عرض جميع طلبات الموظفين

Testing hierarchy:
- Level 1 (Admin): Full access to everything
- Level 2 (Manager): Access to team data, needs cars_manage for car delivery
- Level 3 (User): Access to own data only
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')

# Test credentials
ADMIN_CREDS = {"username": "admin", "password": "123456"}
MANAGER_CREDS = {"username": "Eng Medhat Hussien", "password": "123456"}


class TestLoginSystem:
    """Test login functionality"""
    
    def test_admin_login_success(self):
        """Test admin login returns valid token and user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login successful - role: {data['user']['role']}")
    
    def test_manager_login_success(self):
        """Test Manager (Level 2) login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MANAGER_CREDS)
        assert response.status_code == 200, f"Manager login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"✅ Manager login successful - username: {data['user']['username']}")
    
    def test_invalid_login_rejected(self):
        """Test invalid credentials are rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "invalid_user", "password": "wrong_password"
        })
        assert response.status_code == 401
        print("✅ Invalid login correctly rejected")


class TestPermissionsEndpoint:
    """Test permissions API endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        return response.json()["access_token"]
    
    def test_get_all_permissions(self, admin_token):
        """Test fetching all available permissions"""
        response = requests.get(
            f"{BASE_URL}/api/permissions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        permissions = response.json()
        assert isinstance(permissions, list)
        assert len(permissions) > 0
        
        # Check for new permissions
        perm_keys = [p["key"] for p in permissions]
        assert "cars" in perm_keys, "Missing 'cars' permission"
        assert "cars_manage" in perm_keys, "Missing 'cars_manage' permission"
        assert "view_all_invoices" in perm_keys, "Missing 'view_all_invoices' permission"
        assert "view_all_employee_requests" in perm_keys, "Missing 'view_all_employee_requests' permission"
        
        print(f"✅ Fetched {len(permissions)} permissions")
        print(f"   New permissions found: cars, cars_manage, view_all_invoices, view_all_employee_requests")
    
    def test_permissions_have_correct_groups(self, admin_token):
        """Verify permissions are in correct groups"""
        response = requests.get(
            f"{BASE_URL}/api/permissions",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        permissions = response.json()
        
        # Check groups
        for perm in permissions:
            if perm["key"] in ["cars", "cars_manage"]:
                assert perm["group"] == "السيارات", f"Permission {perm['key']} should be in 'السيارات' group"
            elif perm["key"] == "view_all_invoices":
                assert perm["group"] == "المالية", f"Permission {perm['key']} should be in 'المالية' group"
            elif perm["key"] == "view_all_employee_requests":
                assert perm["group"] == "الموارد البشرية", f"Permission {perm['key']} should be in 'الموارد البشرية' group"
        
        print("✅ All new permissions are in correct groups")


class TestCarsEndpoint:
    """Test cars API with permission levels"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        return response.json()["access_token"]
    
    @pytest.fixture
    def manager_token(self):
        """Get manager token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MANAGER_CREDS)
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    def test_admin_can_get_all_cars(self, admin_token):
        """Admin (Level 1) can see all cars"""
        response = requests.get(
            f"{BASE_URL}/api/cars",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "cars" in data or isinstance(data, list)
        print(f"✅ Admin can access cars endpoint - found {data.get('total_count', len(data))} cars")
    
    def test_manager_can_get_team_cars(self, manager_token):
        """Manager (Level 2) can see team cars"""
        if not manager_token:
            pytest.skip("Manager credentials not available")
        
        response = requests.get(
            f"{BASE_URL}/api/cars",
            headers={"Authorization": f"Bearer {manager_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Manager can access cars endpoint - found {data.get('total_count', 0)} cars")
    
    def test_cars_endpoint_requires_auth(self):
        """Cars endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/cars")
        assert response.status_code in [401, 403]
        print("✅ Cars endpoint correctly requires authentication")
    
    def test_get_project_users_for_cars(self, admin_token):
        """Test getting users for car assignment"""
        # First get projects
        projects_response = requests.get(
            f"{BASE_URL}/api/projects",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        projects = projects_response.json()
        
        if len(projects) > 0:
            project_name = projects[0]["name"]
            response = requests.get(
                f"{BASE_URL}/api/cars/project/{project_name}/users",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            users = response.json()
            assert isinstance(users, list)
            print(f"✅ Got {len(users)} users for project car assignment")
        else:
            pytest.skip("No projects available")


class TestInvoicesEndpoint:
    """Test invoices API with view_all_invoices permission"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        return response.json()["access_token"]
    
    @pytest.fixture
    def manager_token(self):
        """Get manager token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=MANAGER_CREDS)
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    
    def test_admin_can_get_all_invoices(self, admin_token):
        """Admin can see all invoices"""
        response = requests.get(
            f"{BASE_URL}/api/invoices",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "invoices" in data or isinstance(data, list)
        print(f"✅ Admin can access invoices - found {data.get('total_count', len(data))} invoices")
    
    def test_invoices_with_filters(self, admin_token):
        """Test invoices endpoint with filters"""
        # Test with status filter
        response = requests.get(
            f"{BASE_URL}/api/invoices?status=pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✅ Invoices filter by status works")
        
        # Test with project filter
        projects_response = requests.get(
            f"{BASE_URL}/api/projects",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        projects = projects_response.json()
        if len(projects) > 0:
            project_name = projects[0]["name"]
            response = requests.get(
                f"{BASE_URL}/api/invoices?project={project_name}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            print("✅ Invoices filter by project works")
    
    def test_invoices_endpoint_requires_auth(self):
        """Invoices endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/invoices")
        assert response.status_code in [401, 403]
        print("✅ Invoices endpoint correctly requires authentication")


class TestEmployeeRequestsEndpoint:
    """Test employee requests API with view_all_employee_requests permission"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        return response.json()["access_token"]
    
    def test_admin_can_get_all_employee_requests(self, admin_token):
        """Admin can see all employee requests"""
        response = requests.get(
            f"{BASE_URL}/api/employee-requests",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "requests" in data or isinstance(data, list)
        print(f"✅ Admin can access employee requests - found {data.get('total_count', 0)} requests")
    
    def test_employee_requests_endpoint_requires_auth(self):
        """Employee requests endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/employee-requests")
        assert response.status_code in [401, 403]
        print("✅ Employee requests endpoint correctly requires authentication")


class TestUsersAndPermissionsManagement:
    """Test user management and permissions assignment"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        return response.json()["access_token"]
    
    def test_admin_can_get_users(self, admin_token):
        """Admin can fetch users list"""
        response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        print(f"✅ Admin fetched {len(users)} users")
    
    def test_admin_can_update_user_permissions(self, admin_token):
        """Admin can update user permissions"""
        # Get users first
        users_response = requests.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        users = users_response.json()
        
        if len(users) == 0:
            pytest.skip("No users to test")
        
        target_user = users[0]
        original_perms = target_user.get("permissions", [])
        
        # Update permissions (keep same to avoid breaking anything)
        response = requests.put(
            f"{BASE_URL}/api/users/{target_user['id']}/permissions",
            json={"permissions": original_perms},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print(f"✅ Admin can update permissions for user {target_user['username']}")
    
    def test_get_projects(self, admin_token):
        """Test fetching projects list"""
        response = requests.get(
            f"{BASE_URL}/api/projects",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        projects = response.json()
        assert isinstance(projects, list)
        print(f"✅ Fetched {len(projects)} projects")


class TestAuthMeEndpoint:
    """Test /auth/me endpoint"""
    
    def test_auth_me_returns_current_user(self):
        """Test /auth/me endpoint returns current user"""
        login = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = login.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        user = response.json()
        assert user["username"] == "admin"
        assert "permissions" in user
        print("✅ /auth/me endpoint working correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
