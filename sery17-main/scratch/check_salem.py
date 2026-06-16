import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = AsyncIOMotorClient(mongo_url)
db = client['wfm_reports']

async def check():
    u = await db.users.find_one({'username': 'Salem AlQahtani'})
    with open('scratch/salem_role.txt', 'w', encoding='utf-8') as f:
        if u:
            f.write(f"Salem AlQahtani role: {u.get('role')}\n")
            f.write(f"Projects: {u.get('projects')}\n")
        else:
            f.write('Not found\n')

asyncio.run(check())
