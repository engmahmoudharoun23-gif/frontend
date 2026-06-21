import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://127.0.0.1:27017/')
    db = client.wfm_db  # Usually the DB is wfm_db
    reps = await db.safety_reports.find().sort('_id', -1).limit(5).to_list(5)
    for r in reps:
        print("ID:", r.get('id'), "KEYS:", list(r.keys()))
        if 'image' in r:
            print("IMAGE:", type(r['image']), len(r['image']) if isinstance(r['image'], str) else r['image'])
        if 'images' in r:
            print("IMAGES:", type(r['images']), len(r['images']) if isinstance(r['images'], list) else r['images'])

asyncio.run(check())
