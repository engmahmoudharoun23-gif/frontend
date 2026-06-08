import asyncio
import sys
import json
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def list_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    users = await db.users.find().to_list(100)
    for u in users:
        print(f"User: {u.get('username')}")
        print(f"Role: {u.get('role')}")
        print(f"Project Permissions: {json.dumps(u.get('project_permissions', {}), ensure_ascii=False)}")
        print("-" * 20)
    client.close()

if __name__ == "__main__":
    asyncio.run(list_users())
