import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    users = await db.users.find({}, {'username': 1, 'role': 1, 'projects': 1, 'governorates': 1}).to_list(100)
    print("Users Detail:")
    for u in users:
        print(f" - {u.get('username')} | Role: {u.get('role')} | Projects: {u.get('projects')} | Govs: {u.get('governorates')}")
    
    trash = await db.reports.find({"is_deleted": True}).to_list(100)
    print(f"\nTrash items ({len(trash)}):")
    for t in trash:
        print(f" - ID: {t.get('id')} | Num: {t.get('report_number')} | Project: {t.get('project')} | Gov: {t.get('governorate')}")

if __name__ == "__main__":
    asyncio.run(main())
