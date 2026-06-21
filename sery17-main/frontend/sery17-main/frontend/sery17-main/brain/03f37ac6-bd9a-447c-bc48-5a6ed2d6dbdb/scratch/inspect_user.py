import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    print("--- Listing all users and their levels ---")
    async for u in db.users.find({}):
        print(f"User: {u.get('username')}, Role: {u.get('role')}, Level: {u.get('level')}, HasSubUsers: {u.get('has_sub_users')}")
    await client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
