import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_admin():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # Hash password 'admin123'
    hashed = pwd_context.hash("admin123")
    
    result = await db.users.update_one(
        {"username": "admin"},
        {"$set": {"hashed_password": hashed}}
    )
    if result.modified_count > 0:
        print("Successfully reset admin password to 'admin123'")
    else:
        print("Failed to reset admin password or it was already 'admin123'")
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_admin())
