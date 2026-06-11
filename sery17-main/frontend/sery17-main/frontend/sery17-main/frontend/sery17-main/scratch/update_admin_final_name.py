import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def update_admin_final():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    new_name = "مهندس النظام وتحليل البيانات"
    await db.users.update_one(
        {"username": "admin"},
        {"$set": {"full_name": new_name}}
    )
    print(f"Updated admin name to: {new_name}")
    client.close()

if __name__ == "__main__":
    asyncio.run(update_admin_final())
