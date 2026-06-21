import requests
import json
import jwt
import os
from datetime import datetime, timedelta

# Create a valid token for Medhat
SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkey123456789")
ALGORITHM = "HS256"

data = {"sub": "Eng Medhat Hussien"}
expire = datetime.utcnow() + timedelta(minutes=15)
data.update({"exp": expire})
token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

headers = {"Authorization": f"Bearer {token}"}
print(f"Testing /reports/last-72-hours-list?base_date=2026-05-26 with Medhat's token...")
res = requests.get("http://localhost:8001/api/reports/last-72-hours-list?base_date=2026-05-26", headers=headers)
print("Status code:", res.status_code)

res_json = res.json()
if isinstance(res_json, dict):
    reports = res_json.get("reports", [])
    print("List count:", len(reports))
    for r in reports:
        print(f"- {r.get('report_number')} ({r.get('project')}) on {r.get('start_date')}")
else:
    print(res_json)
