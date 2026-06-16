import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')['wfm_reports']
    u = await db.users.find_one({"username": "omer_gehad"})
    if not u:
        users = await db.users.find().to_list(10)
        u = users[0]
    print("User role:", u.get('role'))
    print("User projects:")
    for p in u.get('projects', []):
        if 'الموس' in p:
            print("Project string inside user:", repr(p))
            
    reports = await db.reports.find().sort("_id", -1).limit(5).to_list(5)
    for r in reports:
        if 'الموس' in r.get('project', ''):
            print("Project string inside report:", repr(r.get('project')))

if __name__ == '__main__':
    asyncio.run(test())
