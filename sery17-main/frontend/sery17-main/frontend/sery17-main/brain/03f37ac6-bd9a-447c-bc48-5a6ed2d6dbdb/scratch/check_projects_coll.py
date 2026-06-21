import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    projects = await db.projects.find().to_list(100)
    for p in projects:
        print(f"Project: {p.get('name')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
