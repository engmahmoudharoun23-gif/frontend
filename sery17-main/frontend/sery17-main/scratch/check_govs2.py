import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def main():
    client = AsyncIOMotorClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client["wfm_reports"]
    
    pipeline = [
        {"$match": {"project": {"$regex": "محافظات.*غربي", "$options": "i"}, "is_deleted": {"$ne": True}}},
        {"$group": {"_id": "$governorate", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    results = await db.reports.aggregate(pipeline).to_list(100)
    with open("../scratch/gov_counts.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

asyncio.run(main())
