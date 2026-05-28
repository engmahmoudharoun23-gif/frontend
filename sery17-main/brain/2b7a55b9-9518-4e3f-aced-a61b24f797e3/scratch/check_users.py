
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_users_and_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    users = await db.users.find({}, {"username": 1, "role": 1, "projects": 1, "id": 1}).to_list(100)
    for u in users:
        print(f"User: {u.get('username')}, Role: {u.get('role')}, Projects: {u.get('projects')}, ID: {u.get('id')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users_and_projects())
