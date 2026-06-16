import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')['wfm_reports']
    us = await db.users.find({"username": {"$in": ["Mahmoud", "MMahmoud", "omer_gehad", "omer_gehad2"]}}).to_list(10)
    for u in us:
        print("User:", u.get('username'))
        print("Govs:", [repr(g.encode('utf-8')) for g in u.get('governorates', [])])

    reports = await db.reports.find({"project": {"$regex": "الموس"}}).sort("_id", -1).limit(5).to_list(5)
    for r in reports:
        print("Report ID:", r.get('id'), "Gov:", repr(r.get('governorate', '').encode('utf-8')))
if __name__ == '__main__':
    asyncio.run(test())
