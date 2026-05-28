import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_database_admin():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # 1. Update the 'admin' user to have strict values
    await db.users.update_one(
        {"username": "admin"},
        {
            "$set": {
                "role": "admin",
                "is_active": True,
                "full_name": "Main Admin"
            }
        }
    )
    
    # 2. Ensure all users created by 'admin' have the correct created_by ID
    admin = await db.users.find_one({"username": "admin"})
    if admin:
        admin_id = admin['id']
        await db.users.update_many(
            {"created_by": "admin"}, # Just in case some used the string "admin"
            {"$set": {"created_by": admin_id}}
        )
    
    print("Database updated successfully.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_database_admin())
