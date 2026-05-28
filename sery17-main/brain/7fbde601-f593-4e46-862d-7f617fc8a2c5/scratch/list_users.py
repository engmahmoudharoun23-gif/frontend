import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    users = await db.users.find({}).to_list(100)
    print("Usernames:")
    for u in users:
        print(f" - '{u.get('username')}'")

if __name__ == "__main__":
    asyncio.run(main())
