import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = "mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['wfm_reports']
    
    docs = await db.project_governorates.find({}).to_list(100)
    for d in docs:
        if d.get('project'):
            print(d.get('project').encode('utf-8'))

asyncio.run(main())
