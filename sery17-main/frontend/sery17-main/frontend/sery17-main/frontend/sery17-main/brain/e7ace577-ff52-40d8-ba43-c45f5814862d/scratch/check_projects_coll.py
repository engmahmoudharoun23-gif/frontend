from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

async def check_projects_collection():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Projects Collection ---")
    async for project in db.projects.find():
        print(f"Project Name: {project.get('name')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_projects_collection())
