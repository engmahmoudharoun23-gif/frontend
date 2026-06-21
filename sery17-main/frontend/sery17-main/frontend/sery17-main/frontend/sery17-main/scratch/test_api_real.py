import asyncio
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.append('d:/sery17-main/sery17-main/backend')
from server import create_access_token
import requests
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    c = AsyncIOMotorClient('mongodb://localhost:27017')
    db = c['wfm_reports']
    u = await db.users.find_one({"username": "Mohamed Shawqi"})
    if not u:
        print("User not found!")
        return
        
    token_data = {"sub": str(u['id']), "username": u['username'], "role": u['role']}
    token = create_access_token(token_data)
    print("TOKEN:", token)
    
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get("http://localhost:8001/api/reports/consultant-notes", headers=headers)
    print("STATUS:", res.status_code)
    try:
        data = res.json()
        reports = data.get("reports", [])
        print("RETURNED REPORTS:", len(reports))
        for r in reports:
            print("=>", r.get("report_number"), r.get("project"), r.get("governorate"), r.get("consultant_note"))
    except Exception as e:
        print("ERROR:", e, res.text)
        
    c.close()

asyncio.run(run())
