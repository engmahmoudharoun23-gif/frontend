import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_users():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    print("--- USERS ---")
    async for user in db.users.find():
        print(f"Username: {user.get('username')}")
        print(f"Full Name: {user.get('full_name')}")
        print(f"Role: {user.get('role')}")
        print(f"Permissions: {user.get('permissions', [])}")
        print(f"Project Permissions: {user.get('project_permissions', {})}")
        print("-" * 30)
        
    client.close()

if __name__ == "__main__":
    asyncio.run(list_users())
