import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_data():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # 1. Unique projects in reports
    projects = await db.reports.distinct("project")
    print("Unique projects in reports:")
    for p in projects:
        print(f"- {repr(p)}")
        
    # 2. Search for any report containing "تشوه" or "بصري" in any field
    cursor = db.reports.find({})
    reports = await cursor.to_list(length=500)
    print(f"\nTotal reports in database: {len(reports)}")
    
    for r in reports:
        proj = r.get('project', '')
        desc = r.get('description', '')
        title = r.get('title', '')
        if "تشوه" in proj or "بصري" in proj or "تشوه" in desc or "بصري" in desc or "تشوه" in title or "بصري" in title:
            print(f"MATCH: ID: {r.get('_id')}, Project: {repr(proj)}, Title: {repr(title)}, Desc: {repr(desc)}")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(list_data())
