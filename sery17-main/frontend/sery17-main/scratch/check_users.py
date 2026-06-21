import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def main():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.wfm_reports
    
    print("--- User Permissions Check ---")
    cursor = db.users.find({})
    async for u in cursor:
        print(f"Username: {u.get('username')}")
        print(f"  Role: {u.get('role')}")
        print(f"  Projects: {u.get('projects')}")
        print(f"  Governorates: {u.get('governorates')}")
        print(f"  Permissions: {u.get('permissions')}")
        print(f"  Project Permissions: {u.get('project_permissions')}")
        print("-" * 30)
        
if __name__ == '__main__':
    asyncio.run(main())
