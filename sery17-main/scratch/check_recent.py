import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = AsyncIOMotorClient(mongo_url)
db = client['wfm_reports']

async def check():
    with open('scratch/recent_db.txt', 'w', encoding='utf-8') as f:
        f.write('--- Latest Users ---\n')
        users = await db.users.find().sort('_id', -1).limit(5).to_list(5)
        for u in users:
            f.write(f"{u.get('username')} - {u.get('projects')}\n")
            
        f.write('\n--- Latest Projects ---\n')
        projs = await db.projects.find().sort('_id', -1).limit(5).to_list(5)
        for p in projs:
            f.write(f"{p.get('name')}\n")
            
        f.write('\n--- Latest Reports ---\n')
        reps = await db.reports.find().sort('_id', -1).limit(5).to_list(5)
        for r in reps:
            f.write(f"{r.get('report_number')} - {r.get('project')}\n")

asyncio.run(check())
