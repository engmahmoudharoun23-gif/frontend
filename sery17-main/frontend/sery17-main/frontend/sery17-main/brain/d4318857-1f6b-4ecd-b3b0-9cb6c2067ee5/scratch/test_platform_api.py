import requests

def test_api():
    try:
        response = requests.get("http://localhost:8000/api/settings/platform")
        print(f"Status Code: {response.status_code}")
        print(f"Response Data: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
