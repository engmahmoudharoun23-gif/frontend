import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_team():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    members = await db.team_members.find().to_list(100)
    print("Team Members in DB:")
    for m in members:
        print(f"- Name: {m.get('name')}, Role: {m.get('role')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_team())
