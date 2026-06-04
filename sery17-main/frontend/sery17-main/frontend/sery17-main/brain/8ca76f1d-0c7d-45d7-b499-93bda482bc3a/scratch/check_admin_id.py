import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

async def check_admin_id():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    admin = await db.users.find_one({"username": "admin"})
    if admin:
        print(f"Admin User: {admin.get('username')}")
        print(f"  ID: {admin.get('id')}")
        if not admin.get('id'):
            new_id = str(uuid.uuid4())
            await db.users.update_one({"username": "admin"}, {"$set": {"id": new_id}})
            print(f"  Assigned new ID: {new_id}")
    else:
        print("Admin user not found.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_admin_id())
