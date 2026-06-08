import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_admin_name():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    u = await db.users.find_one({"username": "admin"})
    if u:
        print(f"Username: {u.get('username')}")
        print(f"Full Name: {u.get('full_name')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_admin_name())
