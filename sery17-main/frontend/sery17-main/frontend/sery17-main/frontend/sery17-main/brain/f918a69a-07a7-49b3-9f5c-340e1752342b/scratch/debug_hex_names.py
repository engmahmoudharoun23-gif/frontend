
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def debug_exact_names():
    env_path = Path("d:/sery17-main/sery17-main/backend/.env")
    load_dotenv(dotenv_path=env_path)
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    
    user = await db.users.find_one({"username": {"$regex": "Mohamed Shawqi", "$options": "i"}})
    if user:
        print(f"User Projects: {[p.encode('utf-8').hex() for p in user.get('projects', [])]}")
        for p in user.get('projects', []):
            print(f"Project: {p}")
            
    reports = await db.reports.find({"created_by": user.get('id')}).limit(1).to_list(1)
    if reports:
        r = reports[0]
        print(f"Report Project: {r.get('project').encode('utf-8').hex()}")
        print(f"Report Project: {r.get('project')}")

if __name__ == "__main__":
    asyncio.run(debug_exact_names())
