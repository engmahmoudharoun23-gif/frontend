import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    users = await db.users.find({"full_name": {"$regex": "محمد شوقي"}}).to_list(None)
    
    for u in users:
        print("USER:", u.get('username'), u.get('full_name'))
        print("Projects:", u.get('projects'))
        print("Govs:", u.get('governorates'))
        print("Perms:", u.get('permissions'))
        print("Project Perms:", u.get('project_permissions'))
        print("---")
        
    report = await db.reports.find_one(
        {"consultant_note": {"$exists": True, "$ne": ""}},
        sort=[("updated_at", -1)]
    )
    if report:
        print("LATEST NOTE REPORT:", report.get("report_number"), report.get("project"), report.get("governorate"))
    
    client.close()

if __name__ == '__main__':
    asyncio.run(main())
