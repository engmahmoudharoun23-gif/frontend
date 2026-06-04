import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_project_schema():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    projects = await db.projects.find().to_list(10)
    for p in projects:
        print(f"Project: {p.get('name')}")
        print(f"Statuses: {p.get('statuses')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_project_schema())
