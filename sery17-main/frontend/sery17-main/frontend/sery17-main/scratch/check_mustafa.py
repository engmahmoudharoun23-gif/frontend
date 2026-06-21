import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_mustafa():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    user = await db.users.find_one({"username": "مصطفى"})
    if user:
        print(f"User: {user.get('username')}")
        print(f"Role: {user.get('role')}")
        print(f"Projects: {user.get('projects')}")
        print(f"Project Permissions: {user.get('project_permissions')}")
        print(f"Global Permissions: {user.get('permissions')}")
    else:
        print("User 'مصطفى' not found.")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_mustafa())
