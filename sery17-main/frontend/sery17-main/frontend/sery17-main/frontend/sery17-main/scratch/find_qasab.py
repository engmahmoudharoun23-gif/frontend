import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    govs = await db.reports.distinct('governorate')
    print("GOVS:", [g.encode('utf-8') for g in govs if isinstance(g, str)])

asyncio.run(main())
