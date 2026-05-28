"""
Test suite for Water/Sewage Connections and Export APIs
Tests: connections-stats, water-connections, sewage-connections, export endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://khibra-hub.preview.emergentagent.com')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "123456"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestConnectionsStats:
    """Test /api/connections-stats endpoint"""
    
    def test_connections_stats_endpoint_exists(self, auth_headers):
        """Test that connections-stats endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/connections-stats",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_connections_stats_structure(self, auth_headers):
        """Test that connections-stats returns correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/connections-stats",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check water stats structure
        assert "water" in data, "Missing 'water' key in response"
        assert "total" in data["water"], "Missing 'total' in water stats"
        assert "new" in data["water"], "Missing 'new' in water stats"
        assert "in_progress" in data["water"], "Missing 'in_progress' in water stats"
        assert "completed" in data["water"], "Missing 'completed' in water stats"
        assert "cancelled" in data["water"], "Missing 'cancelled' in water stats"
        
        # Check sewage stats structure
        assert "sewage" in data, "Missing 'sewage' key in response"
        assert "total" in data["sewage"], "Missing 'total' in sewage stats"
        assert "new" in data["sewage"], "Missing 'new' in sewage stats"
        assert "in_progress" in data["sewage"], "Missing 'in_progress' in sewage stats"
        assert "completed" in data["sewage"], "Missing 'completed' in sewage stats"
        assert "cancelled" in data["sewage"], "Missing 'cancelled' in sewage stats"
        
        # Check grand total
        assert "grand_total" in data, "Missing 'grand_total' in response"
        
        print(f"✅ Connections stats: Water={data['water']['total']}, Sewage={data['sewage']['total']}, Total={data['grand_total']}")


class TestWaterConnections:
    """Test /api/water-connections endpoints"""
    
    def test_get_water_connections(self, auth_headers):
        """Test GET water connections list"""
        response = requests.get(
            f"{BASE_URL}/api/water-connections",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"✅ Water connections count: {len(data)}")
    
    def test_water_connections_export_excel_no_data(self, auth_headers):
        """Test Excel export with empty data returns appropriate response"""
        response = requests.post(
            f"{BASE_URL}/api/water-connections/export/excel",
            headers=auth_headers,
            json={"connections": [], "project_name": "Test Project"}
        )
        # Should return 200 even with empty data (creates empty Excel)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get('content-type') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        print("✅ Water connections Excel export works (empty data)")
    
    def test_water_connections_export_excel_with_data(self, auth_headers):
        """Test Excel export with sample data"""
        sample_connection = {
            "id": "test-123",
            "project": "مشروع اختبار",
            "contractor": "مقاول اختبار",
            "request_number": "REQ-001",
            "customer_name": "عميل اختبار",
            "area": "منطقة اختبار",
            "request_status": "جديد"
        }
        response = requests.post(
            f"{BASE_URL}/api/water-connections/export/excel",
            headers=auth_headers,
            json={"connections": [sample_connection], "project_name": "مشروع اختبار"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get('content-type') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        assert len(response.content) > 0, "Excel file should not be empty"
        print(f"✅ Water connections Excel export works (with data, size: {len(response.content)} bytes)")
    
    def test_water_connections_export_pdf_with_data(self, auth_headers):
        """Test PDF export with sample data"""
        sample_connection = {
            "id": "test-123",
            "project": "مشروع اختبار",
            "contractor": "مقاول اختبار",
            "request_number": "REQ-001",
            "customer_name": "عميل اختبار",
            "area": "منطقة اختبار",
            "request_status": "جديد"
        }
        response = requests.post(
            f"{BASE_URL}/api/water-connections/export/pdf",
            headers=auth_headers,
            json={"connections": [sample_connection], "project_name": "مشروع اختبار"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'application/pdf' in response.headers.get('content-type', '')
        assert len(response.content) > 0, "PDF file should not be empty"
        print(f"✅ Water connections PDF export works (size: {len(response.content)} bytes)")


class TestSewageConnections:
    """Test /api/sewage-connections endpoints"""
    
    def test_get_sewage_connections(self, auth_headers):
        """Test GET sewage connections list"""
        response = requests.get(
            f"{BASE_URL}/api/sewage-connections",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"✅ Sewage connections count: {len(data)}")
    
    def test_sewage_connections_export_excel_with_data(self, auth_headers):
        """Test Excel export with sample data"""
        sample_connection = {
            "id": "test-456",
            "project": "مشروع اختبار صرف",
            "contractors": ["مقاول 1", "مقاول 2"],
            "request_number": "REQ-002",
            "customer_name": "عميل صرف",
            "area": "منطقة صرف",
            "request_status": "جديد"
        }
        response = requests.post(
            f"{BASE_URL}/api/sewage-connections/export/excel",
            headers=auth_headers,
            json={"connections": [sample_connection], "project_name": "مشروع اختبار صرف"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get('content-type') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        assert len(response.content) > 0, "Excel file should not be empty"
        print(f"✅ Sewage connections Excel export works (size: {len(response.content)} bytes)")
    
    def test_sewage_connections_export_pdf_with_data(self, auth_headers):
        """Test PDF export with sample data"""
        sample_connection = {
            "id": "test-456",
            "project": "مشروع اختبار صرف",
            "contractors": ["مقاول 1", "مقاول 2"],
            "request_number": "REQ-002",
            "customer_name": "عميل صرف",
            "area": "منطقة صرف",
            "request_status": "جديد"
        }
        response = requests.post(
            f"{BASE_URL}/api/sewage-connections/export/pdf",
            headers=auth_headers,
            json={"connections": [sample_connection], "project_name": "مشروع اختبار صرف"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert 'application/pdf' in response.headers.get('content-type', '')
        assert len(response.content) > 0, "PDF file should not be empty"
        print(f"✅ Sewage connections PDF export works (size: {len(response.content)} bytes)")


class TestProjects:
    """Test /api/projects endpoint"""
    
    def test_get_projects(self, auth_headers):
        """Test GET projects list"""
        response = requests.get(
            f"{BASE_URL}/api/projects",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"✅ Projects count: {len(data)}")
        if data:
            print(f"   Sample project: {data[0].get('name', 'N/A')}")


class TestDashboard:
    """Test Dashboard related endpoints"""
    
    def test_reports_stats(self, auth_headers):
        """Test reports stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/reports/stats",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        print(f"✅ Reports stats: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
