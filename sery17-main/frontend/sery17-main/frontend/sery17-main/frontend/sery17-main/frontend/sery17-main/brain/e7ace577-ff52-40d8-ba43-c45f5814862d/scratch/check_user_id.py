from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def check_user_id():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    user_id = 'b6a212e1-d101-48cb-af4d-2ad988b21d79'
    user = await db.users.find_one({"id": user_id})
    print(f"User for ID {user_id}: {user.get('username') if user else 'Not found'}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_user_id())
