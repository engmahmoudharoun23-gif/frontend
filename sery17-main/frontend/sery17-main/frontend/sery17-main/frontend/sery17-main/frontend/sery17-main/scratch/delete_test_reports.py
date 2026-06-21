import asyncio
import motor.motor_asyncio

client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
db = client['wfm_reports']

async def delete_test_reports():
    ids_to_delete = [
        'eacbaaf6-e385-483d-8249-6137113a9a6c',
        '19e9e278-1e8c-4018-baf4-12b854cf7d9c'
    ]
    result = await db.reports.delete_many({"id": {"$in": ids_to_delete}})
    print(f"DELETED COUNT: {result.deleted_count}")

asyncio.run(delete_test_reports())
