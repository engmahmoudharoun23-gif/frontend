import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    users = await db.users.find({"role": {"$ne": "admin"}}).to_list(1000)
    for user in users:
        pp = user.get("project_permissions", {})
        updated = False
        for proj, perms in pp.items():
            if "business_reports_review" not in perms:
                perms.append("business_reports_review")
                updated = True
        
        if updated:
            await db.users.update_one({"id": user["id"]}, {"$set": {"project_permissions": pp}})
            print(f"Granted review to {user.get('username')}")

if __name__ == "__main__":
    asyncio.run(main())
