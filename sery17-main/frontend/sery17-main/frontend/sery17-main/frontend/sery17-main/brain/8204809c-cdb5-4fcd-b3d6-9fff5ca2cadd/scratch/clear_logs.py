
import motor.motor_asyncio
import asyncio

async def clear_logs():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Since reports are gone, we can clear recent activity logs to make notifications empty
    result = await db.activity_logs.delete_many({})
    print(f"Cleared {result.deleted_count} activity logs.")

asyncio.run(clear_logs())
