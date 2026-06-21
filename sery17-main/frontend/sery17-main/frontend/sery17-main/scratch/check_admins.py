import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
async def run():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    admins = await db.users.find({'role': 'admin'}).to_list(10)
    print([a.get('username') for a in admins])
    expert = await db.users.find({'username': 'مكتب بيت الخبرة للاستشارات الهندسية'}).to_list(1)
    print("Expert role:", [a.get('role') for a in expert])
asyncio.run(run())
