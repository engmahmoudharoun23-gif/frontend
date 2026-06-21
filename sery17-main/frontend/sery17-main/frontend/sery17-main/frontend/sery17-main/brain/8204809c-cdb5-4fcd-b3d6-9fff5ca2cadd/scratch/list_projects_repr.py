
import motor.motor_asyncio
import asyncio

async def list_unique_projects():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    projects = await db.reports.distinct("project")
    print("Unique projects in 'reports' collection (REPR):")
    for p in projects:
        if p:
            print(f" - {repr(p)}")
        else:
            print(" - None")

asyncio.run(list_unique_projects())
