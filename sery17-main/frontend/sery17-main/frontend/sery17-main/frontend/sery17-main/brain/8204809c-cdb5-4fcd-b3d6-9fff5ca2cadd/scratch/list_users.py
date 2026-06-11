
import motor.motor_asyncio
import asyncio

async def list_users():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    users = await db.users.find({}, {"username": 1, "full_name": 1, "role": 1}).to_list(100)
    for u in users:
        print(f" - {u.get('username')} ({u.get('full_name')})")

asyncio.run(list_users())
