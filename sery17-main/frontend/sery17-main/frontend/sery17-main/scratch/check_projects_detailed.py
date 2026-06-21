import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_projects():
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017')
        db = client['wfm_reports']
        projects = await db.projects.find({}).to_list(length=100)
        for p in projects:
            print(f"Name: {p.get('name')}, Type: {p.get('type', 'N/A')}")
        client.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_projects())
