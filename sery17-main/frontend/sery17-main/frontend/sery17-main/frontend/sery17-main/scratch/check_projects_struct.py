import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    projects = await db.projects.find().to_list(100)
    for p in projects:
        print(f"Project: {p.get('name')}, Keys: {list(p.keys())}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_projects())
