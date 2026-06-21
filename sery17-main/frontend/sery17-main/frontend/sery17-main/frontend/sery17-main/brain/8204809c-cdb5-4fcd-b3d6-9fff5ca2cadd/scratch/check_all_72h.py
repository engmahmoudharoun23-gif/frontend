import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # get all project names
    all_projects = await db.reports.distinct('project')
    print(f"All project names in DB: {all_projects}")
    
    for name in all_projects:
        print(f"Checking project: {name}")
        count = await db.reports.count_documents({'project': name, 'is_deleted': False})
        print(f"  Total reports: {count}")
        
        # In server.py, seventy_two_hours_ago = reference_time - timedelta(hours=72)
        # reference_time = datetime.utcnow()
        ago = datetime.utcnow() - timedelta(hours=72)
        
        recent = await db.reports.count_documents({
            'project': name, 
            'is_deleted': False,
            '$or': [
                {'start_date': {'$gte': ago}},
                {'created_at': {'$gte': ago.isoformat()}}
            ]
        })
        print(f"  Recent (72h) reports: {recent}")

asyncio.run(check())
