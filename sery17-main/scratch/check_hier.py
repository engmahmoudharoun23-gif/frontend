import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = AsyncIOMotorClient(mongo_url)
db = client['wfm_reports']

async def check():
    with open('scratch/hier_check.txt', 'w', encoding='utf-8') as f:
        users = await db.users.find({'$or': [{'username': 'MMahmoud'}, {'username': 'Mahmoud'}, {'role': 'admin'}]}).to_list(10)
        for u in users:
            f.write(f"User: {u.get('username')} | ID: {u.get('id')} | Role: {u.get('role')} | Manager: {u.get('manager_id')} | Perms: {u.get('permissions')}\n")
            
        reps = await db.reports.find({'project': {'$regex': 'الموسي'}}).to_list(10)
        for r in reps:
            f.write(f"Report: {r.get('report_number')} | Created By: {r.get('created_by')}\n")

asyncio.run(check())
