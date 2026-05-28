import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def find_creators():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    users = await db.users.find().to_list(100)
    all_ids = {u.get('id'): u.get('username') for u in users}
    
    print("User ID Mapping:")
    for uid, uname in all_ids.items():
        print(f"  {uid} -> {uname}")
        
    print("\nOrphaned Users (Creator not found in current users):")
    for u in users:
        cb = u.get('created_by')
        if cb and cb not in all_ids:
            print(f"  User {u.get('username')} created by unknown ID: {cb}")

    client.close()

if __name__ == "__main__":
    asyncio.run(find_creators())
