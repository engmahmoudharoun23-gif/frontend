import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from passlib.context import CryptContext

# Recreate the exact same context as in server.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def get_password_hash(password):
    # Truncate password to 72 bytes to avoid bcrypt limitation (matching server.py)
    if len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

async def fix_admin_password():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    new_hashed = get_password_hash("admin123")
    print(f"New Hash: {new_hashed}")
    
    # Update admin user
    result = await db.users.update_one(
        {"username": "admin"},
        {"$set": {"hashed_password": new_hashed, "password": new_hashed}} # Updating both fields just in case
    )
    
    if result.matched_count > 0:
        print("Admin password updated successfully.")
    else:
        print("Admin user not found.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin_password())
