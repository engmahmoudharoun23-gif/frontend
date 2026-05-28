import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.sery17
    
    # search by regex for "المحافظات الغربية"
    regex = ".*المحافظات.*الغربية.*"
    count = await db.reports.count_documents({'project': {'$regex': regex}, 'is_deleted': False})
    print(f"Total reports matching '{regex}': {count}")
    
    # get actual project names
    names = await db.reports.distinct('project', {'project': {'$regex': regex}})
    print(f"Actual project names: {names}")
    
    for name in names:
        # check recent
        # Note: server.py uses seventy_two_hours_ago = reference_time - timedelta(hours=72)
        # reference_time is UTC now
        ago = datetime.utcnow() - timedelta(hours=72)
        recent = await db.reports.count_documents({
            'project': name, 
            'is_deleted': False,
            '$or': [
                {'start_date': {'$gte': ago}},
                {'created_at': {'$gte': ago.isoformat()}}
            ]
        })
        print(f"Project: {name} | Recent (72h) reports: {recent}")
        
        # Check one report dates
        sample = await db.reports.find_one({'project': name, 'is_deleted': False})
        if sample:
            print(f"  Sample: id={sample.get('id')}, start_date={sample.get('start_date')}, created_at={sample.get('created_at')}")

asyncio.run(check())
