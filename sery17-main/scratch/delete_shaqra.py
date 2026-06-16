import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')['wfm_reports']
    
    reports = await db.reports.find().to_list(1000)
    to_delete = []
    for r in reports:
        gov = r.get('governorate', '')
        proj = r.get('project', '')
        # Direct check on the string
        if 'شقراء' in str(gov) or 'الموس' in str(proj):
            to_delete.append(r.get('id'))
    
    if to_delete:
        res = await db.reports.delete_many({"id": {"$in": to_delete}})
        print(f"Deleted {res.deleted_count} reports that matched criteria.")
    else:
        print("No reports found to delete.")

if __name__ == '__main__':
    asyncio.run(test())
