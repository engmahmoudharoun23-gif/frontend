import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_conn_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    cp = await db.connection_projects.find().to_list(100)
    print("Connection Projects in DB:")
    for p in cp:
        print(f"- {p.get('name')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_conn_projects())
