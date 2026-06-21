import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def debug_receipt_project():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    print("--- Invoices in DB ---")
    async for inv in db.invoices.find({}):
        print(f"ID: {inv.get('id')}, Project: '{inv.get('project')}', Status: {inv.get('status')}, Uploaded By: {inv.get('uploaded_by_name') or inv.get('uploaded_by')}")
    
    print("\n--- Users Check (Project managers / Level 2) ---")
    async for u in db.users.find({"projects": {"$regex": ".*"}}):
        print(f"User: {u.get('username')}, Role: {u.get('role')}, Projects: {u.get('projects')}, Created By: {u.get('created_by')}")

    await client.close()

if __name__ == "__main__":
    asyncio.run(debug_receipt_project())
