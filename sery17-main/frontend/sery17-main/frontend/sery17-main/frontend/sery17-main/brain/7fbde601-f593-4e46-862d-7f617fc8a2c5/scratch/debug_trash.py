import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    users = await db.users.find({}, {'username': 1, 'role': 1, 'full_name': 1}).to_list(100)
    print("Users:")
    for u in users:
        print(f" - {u.get('username')} ({u.get('role')}): {u.get('full_name')}")
    
    trash_count = await db.reports.count_documents({"is_deleted": True})
    print(f"\nDeleted reports count: {trash_count}")
    
    if trash_count > 0:
        reports = await db.reports.find({"is_deleted": True}, {"id": 1, "report_number": 1, "project": 1, "governorate": 1}).to_list(10)
        print("\nSome deleted reports:")
        for r in reports:
            print(f" - ID: {r.get('id')}, Num: {r.get('report_number')}, Project: {r.get('project')}, Gov: {r.get('governorate')}")

if __name__ == "__main__":
    asyncio.run(main())
