import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Check invoices
    invoices = await db.invoices.find({"is_deleted": {"$ne": True}}).to_list(100)
    print("--- Invoices ---")
    for inv in invoices:
        print(f"ID: {inv.get('id')}, Project: {inv.get('project')}, Status: {inv.get('status')}, Uploader: {inv.get('uploaded_by')}")
        
    # Check employee requests
    requests = await db.employee_requests.find({"is_deleted": {"$ne": True}}).to_list(100)
    print("\n--- Employee Requests ---")
    for req in requests:
        print(f"ID: {req.get('id')}, Project: {req.get('project')}, Status: {req.get('status')}, Uploader: {req.get('uploaded_by')}")

    # Check Level 1 user
    users = await db.users.find({}).to_list(1000)
    print("\n--- Users (Level 1 and 2) ---")
    for u in users:
        level = u.get('level')
        # Try to calculate level if not present
        if level is None:
            if u.get('role') == 'admin': level = 1
            elif u.get('can_create_subusers'): level = 2
            else: level = 3
            
        if level in [1, 2]:
            print(f"Name: {u.get('full_name')}, Level: {level}, Projects: {u.get('projects')}")

if __name__ == "__main__":
    asyncio.run(check_data())
