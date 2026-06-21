import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_all_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    users = await db.users.find().to_list(100)
    print("ALL USERS IN DB:")
    for u in users:
        print(f"Username: '{u.get('username')}', Full Name: '{u.get('full_name')}', ID: {u.get('id')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(list_all_users())
