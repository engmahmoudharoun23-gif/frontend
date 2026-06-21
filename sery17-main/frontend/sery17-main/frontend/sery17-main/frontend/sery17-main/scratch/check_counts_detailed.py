import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    w_count = await db.water_connections.count_documents({})
    s_count = await db.sewage_connections.count_documents({})
    r_count = await db.reports.count_documents({})
    s_msg_count = await db.support_messages.count_documents({})
    print(f'Water: {w_count}, Sewage: {s_count}, Reports: {r_count}, Support: {s_msg_count}')
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
