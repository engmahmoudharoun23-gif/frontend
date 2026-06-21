from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

async def list_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Users List ---")
    async for user in db.users.find():
        print(f"ID: {user.get('id')} | Username: {user.get('username')} | Role: {user.get('role')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(list_users())
