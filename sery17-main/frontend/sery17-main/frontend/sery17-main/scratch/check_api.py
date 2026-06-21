import requests
import json

try:
    # First get a token
    login_data = {
        "username": "admin",
        "password": "123"  # Try default passwords or just check projects endpoint without auth if possible
    }
    # Or just hit projects endpoint directly, maybe it requires auth
    # Let's hit the health check
    res = requests.get("http://localhost:8001/api/health", timeout=5)
    print("Health:", res.text)
    
    # Try hitting /api/projects without token (might fail with 401)
    res2 = requests.get("http://localhost:8001/api/projects", timeout=5)
    print("Projects Status:", res2.status_code)
    
except Exception as e:
    print(f"Error: {e}")
