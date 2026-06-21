import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
async def run():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    u = await db.users.find_one({'id': '9e46065b-429c-48b7-af5a-5d0c36470104'})
    print("User role:", u.get('role'))
    print("Username:", u.get('username'))
asyncio.run(run())
