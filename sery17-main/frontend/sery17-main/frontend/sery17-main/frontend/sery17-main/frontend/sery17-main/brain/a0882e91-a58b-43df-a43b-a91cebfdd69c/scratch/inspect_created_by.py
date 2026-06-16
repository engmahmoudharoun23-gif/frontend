import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect_created_by():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    users = await db.users.find().to_list(100)
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"User: {u.get('username')}, ID: {u.get('id')}, CreatedBy: {u.get('created_by')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(inspect_created_by())
