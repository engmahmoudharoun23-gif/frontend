import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    doc = await db.platform_settings.find_one({'key': 'branding'})
    if doc:
        print("flash_announcement:", doc.get('flash_announcement'))
    else:
        print("No branding doc found")

asyncio.run(main())
