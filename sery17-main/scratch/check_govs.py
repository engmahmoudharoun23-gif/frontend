import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def main():
    client = AsyncIOMotorClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client["wfm_reports"]
    
    # Distinct governorates for western gov project
    govs = await db.reports.distinct("governorate", {
        "project": {"$regex": "محافظات.*غربي", "$options": "i"},
        "is_deleted": {"$ne": True}
    })
    print("Governorates in Western Gov project:")
    for g in govs:
        print(f"  - {g}")
    
    # Count per governorate
    pipeline = [
        {"$match": {"project": {"$regex": "محافظات.*غربي", "$options": "i"}, "is_deleted": {"$ne": True}}},
        {"$group": {"_id": "$governorate", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    results = await db.reports.aggregate(pipeline).to_list(100)
    print("\nCounts per governorate:")
    for r in results:
        print(f"  {r['_id']}: {r['count']}")
    
    # Count reports in الدوادمي specifically
    count_dawadmi = await db.reports.count_documents({
        "project": {"$regex": "محافظات.*غربي", "$options": "i"},
        "is_deleted": {"$ne": True},
        "governorate": {"$regex": "دوادمي", "$options": "i"}
    })
    print(f"\nDawadmi reports in Western Gov: {count_dawadmi}")

asyncio.run(main())
