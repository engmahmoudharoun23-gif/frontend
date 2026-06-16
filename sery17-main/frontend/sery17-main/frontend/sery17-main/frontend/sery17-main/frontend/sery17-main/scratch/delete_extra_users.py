import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def delete_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    # Delete all users except admin
    result = await db.users.delete_many({"username": {"$ne": "admin"}})
    print(f"Deleted {result.deleted_count} users.")
    
    # Ensure admin has full power (Level 2/3)
    await db.users.update_one(
        {"username": "admin"},
        {"$set": {"can_create_subusers": True, "role": "admin"}}
    )
    print("Ensured admin has can_create_subusers = True.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(delete_users())
