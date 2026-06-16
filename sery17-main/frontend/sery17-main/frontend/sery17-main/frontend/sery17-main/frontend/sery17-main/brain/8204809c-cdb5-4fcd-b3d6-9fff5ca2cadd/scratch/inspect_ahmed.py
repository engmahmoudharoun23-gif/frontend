
import motor.motor_asyncio
import asyncio

async def inspect_user():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    user = await db.users.find_one({"full_name": {"$regex": "أحمد عيادات", "$options": "i"}})
    if user:
        print(f"User: {user.get('username')}")
        print(f"Role: {user.get('role')}")
        print(f"Projects: {user.get('projects')}")
        print(f"Governorates: {user.get('governorates')}")
        print(f"Can Create Subusers: {user.get('can_create_subusers')}")
    else:
        print("User not found")

asyncio.run(inspect_user())
