import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# Set encoding to utf-8 for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def get_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    projects = await db.projects.find().to_list(100)
    for p in projects:
        name = p.get('name', 'Unknown')
        print(f"Project: {name}")
    client.close()

if __name__ == "__main__":
    asyncio.run(get_projects())
