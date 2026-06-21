import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def audit_users():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    print("--- User Audit ---")
    for u in users:
        print(f"ID: {u.get('id')}, Username: {u.get('username')}, Full Name: {u.get('full_name')}, Role: {u.get('role')}, Created By: {u.get('created_by')}")
    print("------------------")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(audit_users())
