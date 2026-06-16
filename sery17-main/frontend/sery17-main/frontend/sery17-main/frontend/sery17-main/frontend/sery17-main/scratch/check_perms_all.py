import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_perms_all():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    users = await db.users.find().to_list(100)
    print("USER PERMISSIONS SEARCH:")
    for u in users:
        pp = u.get('project_permissions', {})
        if pp:
            print(f"User: {u.get('username')}")
            for proj, perms in pp.items():
                print(f"  Project: {proj}, Perms: {perms}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_perms_all())
