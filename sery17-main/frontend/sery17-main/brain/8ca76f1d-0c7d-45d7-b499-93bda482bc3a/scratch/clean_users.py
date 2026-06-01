import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clean_users():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # 1. Ensure 'admin' has the 'admin' role and is active
    result = await db.users.update_one(
        {"username": "admin"},
        {"$set": {"role": "admin", "is_active": True}}
    )
    print(f"Updated admin: {result.modified_count}")
    
    # 2. Check for any other user with role 'admin'
    admins = await db.users.find({"role": "admin"}).to_list(100)
    for a in admins:
        if a.get('username') != "admin":
            print(f"Found another admin: {a.get('username')}")
            # If the user wants only the main admin to be hidden, 
            # and they see "الادمن", maybe this other user is the problem.
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clean_users())
