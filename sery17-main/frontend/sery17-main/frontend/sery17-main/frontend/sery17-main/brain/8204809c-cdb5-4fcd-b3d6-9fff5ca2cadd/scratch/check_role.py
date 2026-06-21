
import motor.motor_asyncio
import asyncio

async def check_admin_role():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    user = await db.users.find_one({"username": "admin"})
    if user:
        print(f"Admin User: {user.get('username')}, Role: {user.get('role')}")
    else:
        print("Admin user not found")

asyncio.run(check_admin_role())
