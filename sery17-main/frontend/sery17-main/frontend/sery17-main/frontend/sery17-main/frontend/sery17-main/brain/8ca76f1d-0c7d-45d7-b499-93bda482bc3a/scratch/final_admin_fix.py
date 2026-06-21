import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def final_admin_fix():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # Ensure admin has ALL permissions
    all_perms = ["dashboard", "users_manage", "projects", "settings", "trash", "reports_view", "reports_add", "reports_edit", "reports_delete"]
    
    await db.users.update_one(
        {"username": "admin"},
        {"$set": {"permissions": all_perms}}
    )
    print("Admin permissions updated with 'trash' and 'settings'.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(final_admin_fix())
