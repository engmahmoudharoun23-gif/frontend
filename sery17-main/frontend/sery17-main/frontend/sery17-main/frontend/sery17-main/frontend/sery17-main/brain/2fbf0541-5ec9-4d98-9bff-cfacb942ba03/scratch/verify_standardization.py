import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def verify_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    r_count = await db.reports.count_documents({"report_number": {"$regex": "^CCB-"}})
    r_total = await db.reports.count_documents({"report_number": {"$exists": True, "$ne": ""}})
    
    w_count = await db.water_connections.count_documents({"ccb_report_number": {"$regex": "^CCB-"}})
    w_total = await db.water_connections.count_documents({"ccb_report_number": {"$exists": True, "$ne": ""}})
    
    s_count = await db.sewage_connections.count_documents({"ccb_report_number": {"$regex": "^CCB-"}})
    s_total = await db.sewage_connections.count_documents({"ccb_report_number": {"$exists": True, "$ne": ""}})
    
    print(f"Reports: {r_count} / {r_total} start with CCB-")
    print(f"Water Connections: {w_count} / {w_total} start with CCB-")
    print(f"Sewage Connections: {s_count} / {s_total} start with CCB-")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_data())
