import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def main():
    client = AsyncIOMotorClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client["wfm_reports"]
    
    # 1. Full user doc for Amin Mukhtar
    user = await db.users.find_one({"username": "Amin Mukhtar"}, {"_id": 0, "hashed_password": 0})
    with open("../scratch/amin_full.json", "w", encoding="utf-8") as f:
        json.dump(user, f, ensure_ascii=False, indent=2, default=str)
    
    # 2. Projects collection
    projects = await db.projects.find({}, {"_id": 0}).to_list(100)
    with open("../scratch/all_projects.json", "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2, default=str)
    
    # 3. Reports count per project for المحافظات الغربية
    count = await db.reports.count_documents({
        "project": {"$regex": "محافظات.*غربي", "$options": "i"},
        "is_deleted": {"$ne": True}
    })
    print(f"Western Gov reports (not deleted): {count}")
    
    # 4. Check project_governorates
    govs = await db.project_governorates.find({}, {"_id": 0}).to_list(100)
    with open("../scratch/project_govs.json", "w", encoding="utf-8") as f:
        json.dump(govs, f, ensure_ascii=False, indent=2, default=str)

asyncio.run(main())
