import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    projects = await db.reports.distinct("project")
    print("Projects in DB:", projects)
    
    # Check if there's an 'ايصال' project
    for p in projects:
        if 'ايصال' in p or 'إيصال' in p:
            print("Found connection project:", p)
            
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
