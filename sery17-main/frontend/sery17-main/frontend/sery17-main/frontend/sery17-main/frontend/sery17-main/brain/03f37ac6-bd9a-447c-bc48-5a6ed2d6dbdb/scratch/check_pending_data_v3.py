import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Check Level 1 users
    users = await db.users.find({"level": 1}).to_list(100)
    if not users:
        # Try role admin
        users = await db.users.find({"role": "admin"}).to_list(100)
        
    print("--- Level 1 Users ---")
    for u in users:
        print(f"ID: {u.get('id')}, Name: {u.get('full_name')}, Projects: {u.get('projects')}")

    # Check Invoices projects
    print("\n--- Invoices Projects ---")
    distinct_projects = await db.invoices.distinct("project")
    for p in distinct_projects:
        count = await db.invoices.count_documents({"project": p, "is_deleted": {"$ne": True}})
        print(f"Project: {p}, Count: {count}")

    # Check Invoices with status pending
    print("\n--- Pending Invoices ---")
    pending_invs = await db.invoices.find({"status": "pending", "is_deleted": {"$ne": True}}).to_list(100)
    for inv in pending_invs:
         print(f"ID: {inv.get('id')}, Project: {inv.get('project')}")

if __name__ == "__main__":
    asyncio.run(check_data())
