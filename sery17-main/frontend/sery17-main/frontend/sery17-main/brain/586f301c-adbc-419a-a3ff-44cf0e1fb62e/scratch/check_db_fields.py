import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    # Check one report pending review
    report = await db.reports.find_one({'review_status': 'بانتظار المراجعة', 'is_deleted': False})
    if report:
        # Remove _id for printing
        if '_id' in report: del report['_id']
        print(f"Found report: {report.get('governorate')} - {report.get('project')}")
        print(f"Fields: {list(report.keys())}")
    else:
        print("No pending review reports found.")
    
    # Check the grouping manually
    pipeline = [
        {"$match": {"review_status": "بانتظار المراجعة", "is_deleted": False}},
        {"$group": {"_id": {"gov": "$governorate", "proj": "$project"}, "count": {"$sum": 1}}}
    ]
    results = await db.reports.aggregate(pipeline).to_list(100)
    print(f"Aggregation results: {results}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
