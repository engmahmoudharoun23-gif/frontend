import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def print_users():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    async for user in db.users.find({}, {"_id": 0, "username": 1, "role": 1, "full_name": 1}):
        print(user)
    client.close()

if __name__ == "__main__":
    asyncio.run(print_users())
