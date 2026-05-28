import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_admin_active():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # Check both case variations
    for username in ["admin", "Admin"]:
        user = await db.users.find_one({"username": username})
        if user:
            print(f"User: {user.get('username')}, is_active: {user.get('is_active')}")
            if not user.get('is_active'):
                await db.users.update_one({"username": username}, {"$set": {"is_active": True}})
                print(f"  -> Activated {username}")
        else:
            print(f"User {username} not found.")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_admin_active())
