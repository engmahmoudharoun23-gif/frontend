import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    mongo_url = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
    client = AsyncIOMotorClient(mongo_url)
    db = client['wfm_reports']
    reps = await db.safety_reports.find().sort('_id', -1).limit(5).to_list(5)
    
    for r in reps:
        print("ID:", r.get('id'), "KEYS:", list(r.keys()))
        for key in ['image', 'images', 'file', 'files', 'file_url', 'attachment', 'media', 'pdf']:
            if key in r:
                val = r[key]
                print(f"  {key}:", type(val), len(val) if isinstance(val, (str, list)) else val)

asyncio.run(check())
