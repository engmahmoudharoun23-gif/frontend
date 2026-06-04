import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    users = await db.users.find().to_list(100)
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"User: {u.get('username')}, Role: {u.get('role')}, Project: {u.get('project_id')}, Active: {u.get('is_active')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(inspect_users())
