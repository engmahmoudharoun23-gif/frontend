import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_all():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    users = await db.users.find({}, {'id': 1}).to_list(100)
    user_ids = [u['id'] for u in users]
    
    for coll in [db.reports, db.water_connections, db.sewage_connections]:
        await coll.update_many({}, {'$set': {'seen_by': user_ids, 'deleted_notifications': user_ids}})
    
    print('Cleared all notifications for all users')
    client.close()

asyncio.run(clear_all())
