import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.sery17
    
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

    # Check Level 1 user projects
    user = await db.users.find_one({"full_name": {"$regex": "مستوى واحد", "$options": "i"}})
    if not user:
         user = await db.users.find_one({"level": 1})
         
    if user:
        print(f"\nUser Level 1: {user.get('full_name')}, Projects: {user.get('projects')}")
    else:
        print("\nLevel 1 user not found")

if __name__ == "__main__":
    asyncio.run(check_data())
