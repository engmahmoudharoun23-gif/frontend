import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_reports_encoding():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    print("Checking reports...")
    reports = await db.reports.find().to_list(10)
    for r in reports:
        print(f"ID: {r.get('id')}, Project: {r.get('project')}, Gov: {r.get('governorate')}, Status: {r.get('status')}")
        # Try to see if it's bytes
        for key in ['project', 'governorate', 'status']:
            val = r.get(key)
            if isinstance(val, str):
                try:
                    # Try to re-encode/decode if it was mis-interpreted
                    # This is a common trick: encode as latin-1 then decode as utf-8
                    fixed = val.encode('latin-1').decode('utf-8')
                    print(f"  Fixed {key}: {fixed}")
                except:
                    pass
    client.close()

if __name__ == "__main__":
    asyncio.run(check_reports_encoding())
