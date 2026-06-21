import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    print("Level 2 Users and their permissions:")
    async for user in db.users.find({"can_create_subusers": True, "role": {"$ne": "admin"}}):
        print(f"User: {user.get('username')} | id: {user.get('id')}")
        print(f"  Permissions: {user.get('permissions', [])}")
        print(f"  Project Permissions: {user.get('project_permissions', {})}")
        print("-" * 40)

if __name__ == "__main__":
    asyncio.run(main())
