
import motor.motor_asyncio
import asyncio

async def list_all_projects_detailed():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Check reports
    reports_projects = await db.reports.distinct("project")
    print("Projects in 'reports':")
    for p in reports_projects:
        print(f" - '{p}' (Hex: {p.encode('utf-8').hex() if p else 'None'})")
    
    # Check users
    users_projects = await db.users.distinct("projects")
    print("\nProjects in 'users':")
    for p in users_projects:
        print(f" - '{p}' (Hex: {p.encode('utf-8').hex() if p else 'None'})")

asyncio.run(list_all_projects_detailed())
