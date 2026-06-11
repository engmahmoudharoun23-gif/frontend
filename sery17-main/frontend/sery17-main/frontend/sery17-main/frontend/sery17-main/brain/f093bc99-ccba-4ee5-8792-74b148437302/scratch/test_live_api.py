import requests

def test_live_api():
    try:
        # We need a token. Since I don't have one easily, I'll check if it returns 401 (meaning it's reachable).
        print("Testing LIVE API /api/connections-stats")
        resp = requests.get("http://localhost:8001/api/connections-stats")
        print(f"Response Status: {resp.status_code}")
        print(f"Response Content: {resp.text[:100]}")
    except Exception as e:
        print(f"Error calling API: {e}")

if __name__ == "__main__":
    test_live_api()
