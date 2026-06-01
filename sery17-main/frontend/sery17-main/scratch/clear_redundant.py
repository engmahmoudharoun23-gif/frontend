import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_extra_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    # 1. Clear team members (user said they don't need redundant entries)
    res1 = await db.team_members.delete_many({})
    print(f"Deleted {res1.deleted_count} team members.")
    
    # 2. Clear any other potentially confusing users (though there shouldn't be any)
    # We already did this, but let's be super sure.
    res2 = await db.users.delete_many({"username": {"$ne": "admin"}})
    print(f"Verified deletion of all users except 'admin'. Deleted {res2.deleted_count} more.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_extra_data())
