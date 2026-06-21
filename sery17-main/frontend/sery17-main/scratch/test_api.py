import requests

url = "http://localhost:8001/api/reports"
params = {
    "project": "مشروع المحافظات الغربية - القطاع الأوسط",
    "page": 1,
    "limit": 10
}
try:
    resp = requests.get(url, params=params)
    print("Status:", resp.status_code)
    try:
        data = resp.json()
        print("Keys in response:", data.keys())
        if "total_count" in data:
            print("Total Count in JSON:", data["total_count"])
    except:
        print("Raw response:", resp.text[:500])
except Exception as e:
    print("Error:", e)
