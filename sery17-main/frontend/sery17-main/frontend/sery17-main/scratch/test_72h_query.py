import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta

async def test():
    client = AsyncIOMotorClient("mongodb+srv://mahmoudharoun23:gQzJ2y5yK4fB3m8S@cluster0.h4b1f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    db = client.sery
    
    # 72 hours ago
    seventy_two_hours_ago = datetime.utcnow() - timedelta(hours=72)
    
    # Query 1: start_date vs created_at vs added_at
    reports = await db.reports.find({"is_deleted": {"$ne": True}, "project": {"$regex": "التشوه البصري", "$options": "i"}}).to_list(100)
    print(f"Total reports for التشوه البصري: {len(reports)}")
    
    count_72h_by_created = 0
    count_72h_by_start = 0
    
    for r in reports:
        created = r.get('created_at')
        added = r.get('added_at')
        start = r.get('start_date')
        
        # Check created_at / added_at
        r_created = None
        if isinstance(created, datetime): r_created = created
        elif isinstance(created, str):
            try: r_created = datetime.fromisoformat(created.replace('Z', '+00:00').split('.')[0])
            except: pass
            
        if not r_created and isinstance(added, datetime): r_created = added
        
        if r_created and r_created.replace(tzinfo=None) >= seventy_two_hours_ago:
            count_72h_by_created += 1
            
        # Check start_date
        r_start = None
        if isinstance(start, datetime): r_start = start
        elif isinstance(start, str):
            try: r_start = datetime.fromisoformat(start.replace('Z', '+00:00').split('.')[0])
            except: pass
            
        if not r_start: r_start = r_created
        
        if r_start and r_start.replace(tzinfo=None) >= seventy_two_hours_ago:
            count_72h_by_start += 1
            
    print(f"72h count by created_at: {count_72h_by_created}")
    print(f"72h count by start_date: {count_72h_by_start}")

if __name__ == '__main__':
    asyncio.run(test())
