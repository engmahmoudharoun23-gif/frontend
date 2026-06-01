import requests

def test_api():
    base_url = "http://localhost:8001/api"
    
    # Login as admin
    login_data = {"username": "admin", "password": "admin123"}
    try:
        response = requests.post(f"{base_url}/auth/login", json=login_data)
        response.raise_for_status()
        token = response.json()["access_token"]
        print("Login successful")
        
        # Call the endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{base_url}/reports/pending-review-by-governorate", headers=headers)
        response.raise_for_status()
        data = response.json()
        print(f"API Response: {data}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
