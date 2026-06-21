import requests
import json

BASE_URL = "http://localhost:8001/api"

def test_toggle():
    # 1. Login to get token
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get first report
    response = requests.get(f"{BASE_URL}/reports?limit=1", headers=headers)
    reports = response.json()["reports"]
    if not reports:
        print("No reports found to test toggle")
        return
    
    report_id = reports[0]["id"]
    old_wfm = reports[0].get("wfm_closed", False)
    old_status = reports[0].get("status", "")
    
    print(f"Report ID: {report_id}")
    print(f"Current WFM: {old_wfm}, Current Status: {old_status}")
    
    # 3. Toggle
    print("Toggling...")
    response = requests.put(f"{BASE_URL}/wfm/toggle/{report_id}", headers=headers)
    if response.status_code == 200:
        result = response.json()
        print(f"Toggle Response: {result}")
        
        # 4. Verify in database
        response = requests.get(f"{BASE_URL}/reports?search={reports[0]['report_number']}&exact=true", headers=headers)
        updated_report = response.json()["reports"][0]
        print(f"New WFM: {updated_report.get('wfm_closed')}, New Status: {updated_report.get('status')}")
    else:
        print(f"Toggle failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_toggle()
