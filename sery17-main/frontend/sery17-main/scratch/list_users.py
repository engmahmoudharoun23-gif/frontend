import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client["wfm_reports"]
    users = await db.users.find({}).to_list(None)
    for u in users:
        print(u.get('name', ''), u.get('username', ''), u.get('projects', []))

asyncio.run(main())
