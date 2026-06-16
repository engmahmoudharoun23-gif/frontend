import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = AsyncIOMotorClient(mongo_url)
db = client['wfm_reports']

async def check():
    projs = await db.projects.find().to_list(100)
    with open('scratch/proj_status.txt', 'w', encoding='utf-8') as f:
        f.write(f'Total projects in DB: {len(projs)}\n')
        for p in projs:
            f.write(f"{p.get('name')} - archived: {p.get('is_archived')}\n")

asyncio.run(check())
