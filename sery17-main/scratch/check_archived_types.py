import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = AsyncIOMotorClient(mongo_url)
db = client['wfm_reports']

async def check():
    c4 = await db.projects.count_documents({'is_archived': {'$ne': 'True'}})
    projs = await db.projects.find().to_list(10)
    with open('scratch/test_archived2.txt', 'w', encoding='utf-8') as f:
        f.write(f'Ne string True: {c4}\n')
        for p in projs:
            val = p.get('is_archived')
            f.write(f"{p.get('name')} - type: {type(val)} - val: {val}\n")

asyncio.run(check())
