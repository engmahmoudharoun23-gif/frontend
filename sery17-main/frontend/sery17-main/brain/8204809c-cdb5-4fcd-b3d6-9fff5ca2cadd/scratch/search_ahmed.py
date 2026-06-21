
import motor.motor_asyncio
import asyncio

async def search_ahmed():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    users = await db.users.find({}).to_list(100)
    for u in users:
        fn = u.get('full_name', '')
        if "أحمد" in fn or "احمد" in fn:
            print(f"Found: {u.get('username')} ({fn})")

asyncio.run(search_ahmed())
