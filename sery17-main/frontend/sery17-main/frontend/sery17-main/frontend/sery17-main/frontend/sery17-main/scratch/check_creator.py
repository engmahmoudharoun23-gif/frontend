import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_user():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    user = await db.users.find_one({'id': 'b619d398-1927-4c57-8c56-8499ad5ef297'})
    if user:
        print(f"User: {user.get('username')}, Role: {user.get('role')}")
    else:
        print("User not found")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_user())
