import asyncio
import sys
import json
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    user = await db.users.find_one({"username": "admin"})
    if user:
        print(f"User: {user.get('username')}")
        print(f"Permissions: {user.get('permissions', [])}")
        print(f"Project Permissions: {json.dumps(user.get('project_permissions', {}), ensure_ascii=False, indent=2)}")
    else:
        print("Admin user not found")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_admin())
