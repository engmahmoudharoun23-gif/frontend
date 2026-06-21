from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def check_mmm_perms():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    user = await db.users.find_one({"username": "mmm"})
    if user:
        print(f"User: {user.get('username')}")
        print(f"Projects: {user.get('projects')}")
        print(f"Permissions: {user.get('permissions')}")
        print(f"Project Permissions: {user.get('project_permissions')}")
    else:
        print("User mmm not found")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_mmm_perms())
