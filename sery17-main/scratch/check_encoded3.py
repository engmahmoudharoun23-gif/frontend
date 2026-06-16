import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')['wfm_reports']
    us = await db.users.find().to_list(1000)
    for u in us:
        for p in u.get('projects', []):
            if 'الموس' in p:
                print("User", u.get('username'), "Proj:", repr(p.encode('utf-8')))
if __name__ == '__main__':
    asyncio.run(test())
