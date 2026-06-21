import requests

def verify():
    try:
        r = requests.get("http://localhost:8001/api/settings/platform", timeout=2)
        print("Backend Status:", r.status_code)
        print("Response:", r.json())
    except Exception as e:
        print("Error connecting to backend:", e)

if __name__ == "__main__":
    verify()
