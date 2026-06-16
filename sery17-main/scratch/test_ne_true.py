import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = AsyncIOMotorClient(mongo_url)
db = client['wfm_reports']

async def check():
    c1 = await db.projects.count_documents({})
    c2 = await db.projects.count_documents({'is_archived': {'$ne': True}})
    
    with open('scratch/test_ne_true.txt', 'w', encoding='utf-8') as f:
        f.write(f'Total: {c1}\n')
        f.write(f'Ne True: {c2}\n')

asyncio.run(check())
