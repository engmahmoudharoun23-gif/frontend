import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL="mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    DB_NAME="wfm_reports"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # ابحث عن سالم القحطاني
    salem = await db.users.find_one({"full_name": {"$regex": "سالم القحطاني"}})
    if not salem:
        print("Salem not found!")
        return
        
    print(f"User: {salem.get('full_name')} (ID: {salem.get('id')})")
    print(f"Role: {salem.get('role')}")
    print(f"Projects: {salem.get('projects')}")
    print(f"Global Perms: {salem.get('permissions')}")
    print(f"Project Perms: {salem.get('project_permissions')}")

if __name__ == "__main__":
    asyncio.run(main())
