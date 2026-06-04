
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def debug_shawky_reports():
    env_path = Path("d:/sery17-main/sery17-main/backend/.env")
    load_dotenv(dotenv_path=env_path)
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    
    user = await db.users.find_one({"username": {"$regex": "Mohamed Shawqi", "$options": "i"}})
    if not user:
        print("User not found")
        return
        
    user_id = user.get('id')
    print(f"User ID: {user_id}")
    
    reports = await db.reports.find({"created_by": user_id}).to_list(100)
    print(f"Found {len(reports)} reports")
    for r in reports:
        print(f"Report ID: {r.get('id')}, is_deleted: {r.get('is_deleted')}, project: {r.get('project')}")

if __name__ == "__main__":
    asyncio.run(debug_shawky_reports())
