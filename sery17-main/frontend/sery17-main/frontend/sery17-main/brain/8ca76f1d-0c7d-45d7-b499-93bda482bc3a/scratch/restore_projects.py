import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime, timezone

async def restore_projects():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    projects = ["الرياض", "الدمام", "مكة", "المدينة", "القصيم"]
    
    print(f"Restoring {len(projects)} projects...")
    for p_name in projects:
        exists = await db.projects.find_one({"name": p_name})
        if not exists:
            await db.projects.insert_one({
                "id": str(uuid.uuid4()),
                "name": p_name,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            print(f"  + Added: {p_name}")
        else:
            print(f"  - Already exists: {p_name}")
            
    # Also ensure admin has these projects if they are the only projects
    admin = await db.users.find_one({"username": "admin"})
    if admin:
        await db.users.update_one(
            {"username": "admin"},
            {"$set": {"projects": projects}}
        )
        print("  Admin projects updated.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(restore_projects())
