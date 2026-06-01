
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_riyadh_project_name():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    report = await db.reports.find_one({"is_deleted": True})
    if report:
        project = report.get('project')
        print(f"Project: {project}")
        print(f"Hex: {project.encode('utf-8').hex() if project else 'None'}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_riyadh_project_name())
