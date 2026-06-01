
import motor.motor_asyncio
import asyncio

async def list_users_hex():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    users = await db.users.find({}, {"username": 1, "full_name": 1}).to_list(100)
    for u in users:
        fn = u.get('full_name', '')
        print(f"User: {u.get('username')}, FullNameHex: {fn.encode('utf-8').hex()}")

asyncio.run(list_users_hex())
