import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def test_pass():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    admin = await db.users.find_one({"username": "admin"})
    if admin:
        hashed = admin.get("hashed_password")
        print("Hashed password:", hashed)
        print("Matches '123456':", pwd_context.verify("123456", hashed))
        print("Matches 'admin123':", pwd_context.verify("admin123", hashed))
    else:
        print("Admin user not found")
    client.close()

if __name__ == "__main__":
    asyncio.run(test_pass())
