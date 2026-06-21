import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_permissions():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    async for user in db.users.find():
        print(f"User: {user.get('username')}")
        print(f"  Role: {user.get('role')}")
        print(f"  Permissions: {user.get('permissions')}")
        print(f"  Projects: {user.get('projects')}")
        print(f"  Project Permissions: {user.get('project_permissions')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_permissions())
