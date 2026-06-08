import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def ensure_active():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    await db.users.update_one(
        {"username": "admin"},
        {"$set": {"is_active": True}}
    )
    print("Admin user is now active.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(ensure_active())
