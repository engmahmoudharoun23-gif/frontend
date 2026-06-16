import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')['wfm_reports']
    print("Checking projects in db...")
    projects = await db.projects.find({}).to_list(100)
    for p in projects:
        if 'الموسى' in str(p.get('name')):
            print("FOUND PROJECT:", p.get('name'))
            
    print("\nChecking reports in db...")
    # Find any report created recently
    reports = await db.reports.find({"project": {"$regex": "الموسى"}}).to_list(10)
    for r in reports:
        print("Report ID:", r.get('id'), "Project:", r.get('project'))
        print("Gov:", r.get('governorate'))
        
if __name__ == '__main__':
    asyncio.run(test())
