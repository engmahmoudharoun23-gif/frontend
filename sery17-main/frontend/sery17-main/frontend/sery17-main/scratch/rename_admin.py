import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def rename_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    # Change the full name of 'admin' to the user's name
    new_name = "المهندس محمود هارون"
    await db.users.update_one(
        {"username": "admin"},
        {"$set": {"full_name": new_name}}
    )
    print(f"Changed admin full_name to: {new_name}")
    client.close()

if __name__ == "__main__":
    asyncio.run(rename_admin())
