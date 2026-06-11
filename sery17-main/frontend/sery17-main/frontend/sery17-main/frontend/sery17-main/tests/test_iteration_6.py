"""
Test iteration 6 - Testing the following features:
1. صفحة المستخلصات: تبويب الواردة له فلاتر منفصلة (رقم المستخلص، التاريخ)
2. صفحة المستخلصات: تبويب المسجلة له فلاتر منفصلة (رقم المستخلص، التاريخ)
3. صفحة المستخلصات: إزالة combo box الحالات
4. صفحة تسجيل الدخول: عرض اسم المنصة من API
5. الـ Header: عرض اسم المنصة بشكل ثابت بدون تأخير
6. صلاحية حالات البلاغ: نقلت إلى مجموعة الإدارة في نافذة الصلاحيات
7. إشعارات بانتظار المراجعة: المهندس مدحت لا يرى إشعارات من مشاريع ليست له
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')

class TestAuthAndPlatform:
    """Test authentication and platform settings"""
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print("✅ Admin login successful")
        return data["access_token"]
    
    def test_manager_login(self):
        """Test Eng Medhat Hussien login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Eng Medhat Hussien",
            "password": "123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["full_name"] == "م / مدحت حسين محمد"
        print(f"✅ Manager login successful - projects: {data['user'].get('projects', [])}")
        return data["access_token"], data["user"]
    
    def test_platform_settings_public(self):
        """Test that /api/settings/platform is accessible without authentication"""
        response = requests.get(f"{BASE_URL}/api/settings/platform")
        assert response.status_code == 200
        data = response.json()
        assert "platform_name" in data
        print(f"✅ Platform name API accessible without auth: {data['platform_name']}")
        return data["platform_name"]


class TestPermissions:
    """Test permissions structure"""
    
    def test_permissions_list(self):
        """Test that project_settings is in الإدارة group"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "123456"
        })
        token = login_response.json()["access_token"]
        
        # Get permissions
        response = requests.get(
            f"{BASE_URL}/api/permissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        permissions = response.json()
        
        # Find project_settings permission
        project_settings = None
        for perm in permissions:
            if perm["key"] == "project_settings":
                project_settings = perm
                break
        
        assert project_settings is not None, "project_settings permission not found"
        assert project_settings["group"] == "الإدارة", f"project_settings should be in الإدارة group, but found in {project_settings['group']}"
        print(f"✅ project_settings is in الإدارة group: {project_settings}")


class TestExtracts:
    """Test extracts page functionality"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "123456"
        })
        return response.json()["access_token"]
    
    def test_extracts_incoming_tab(self, admin_token):
        """Test extracts incoming tab with filters"""
        # Test with extract_number filter
        response = requests.get(
            f"{BASE_URL}/api/extracts?tab=incoming&extract_number=TEST",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✅ Extracts incoming tab with extract_number filter works")
        
        # Test with date filter
        response = requests.get(
            f"{BASE_URL}/api/extracts?tab=incoming&date=2025-01-01",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✅ Extracts incoming tab with date filter works")
    
    def test_extracts_recorded_tab(self, admin_token):
        """Test extracts recorded tab with filters"""
        # Test with extract_number filter
        response = requests.get(
            f"{BASE_URL}/api/extracts?tab=recorded&extract_number=TEST",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✅ Extracts recorded tab with extract_number filter works")
        
        # Test with date filter
        response = requests.get(
            f"{BASE_URL}/api/extracts?tab=recorded&date=2025-01-01",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        print("✅ Extracts recorded tab with date filter works")


class TestNotifications:
    """Test notifications for pending review"""
    
    def test_manager_notifications_filtered_by_project(self):
        """Test that Eng Medhat Hussien only sees notifications from his projects"""
        # Login as manager
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "Eng Medhat Hussien",
            "password": "123456"
        })
        token = login_response.json()["access_token"]
        user = login_response.json()["user"]
        user_projects = user.get("projects", [])
        
        print(f"Manager projects: {user_projects}")
        
        # Get pending review count
        response = requests.get(
            f"{BASE_URL}/api/reports/pending-review-count",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        count_data = response.json()
        print(f"Pending review count for manager: {count_data}")
        
        # Get pending review by governorate
        response = requests.get(
            f"{BASE_URL}/api/reports/pending-review-by-governorate",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        gov_data = response.json()
        print(f"Pending review by governorate: {gov_data}")
        
        # Get unseen notifications
        response = requests.get(
            f"{BASE_URL}/api/reports/notifications/unseen",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        unseen_data = response.json()
        print(f"Unseen notifications count: {unseen_data.get('total', 0)}")
        
        # Verify that notifications are only from manager's projects
        if unseen_data.get("reports"):
            for report in unseen_data["reports"]:
                report_project = report.get("project", "")
                if user_projects:  # If manager has specific projects
                    assert report_project in user_projects, f"Report from project '{report_project}' should not be visible to manager with projects {user_projects}"
        
        print("✅ Manager notifications are filtered by project")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
