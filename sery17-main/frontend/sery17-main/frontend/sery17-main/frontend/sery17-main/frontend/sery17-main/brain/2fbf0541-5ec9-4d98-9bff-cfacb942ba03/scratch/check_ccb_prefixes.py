import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_ccb_prefixes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    # Check reports
    reports_count = await db.reports.count_documents({})
    print(f"Total reports: {reports_count}")
    
    no_prefix_reports = await db.reports.find({"report_number": {"$not": {"$regex": "^CCB-"}}}).to_list(100)
    print(f"Reports without CCB- prefix: {len(no_prefix_reports)}")
    for r in no_prefix_reports:
        print(f" - {r['report_number']}")

    # Check water connections
    water_count = await db.water_connections.count_documents({})
    print(f"Total water connections: {water_count}")
    
    no_prefix_water = await db.water_connections.find({"ccb_report_number": {"$not": {"$regex": "^CCB-"}}, "ccb_report_number": {"$ne": ""}}).to_list(100)
    print(f"Water connections without CCB- prefix: {len(no_prefix_water)}")
    for w in no_prefix_water:
        print(f" - {w['ccb_report_number']}")

    # Check sewage connections
    sewage_count = await db.sewage_connections.count_documents({})
    print(f"Total sewage connections: {sewage_count}")
    
    no_prefix_sewage = await db.sewage_connections.find({"ccb_report_number": {"$not": {"$regex": "^CCB-"}}, "ccb_report_number": {"$ne": ""}}).to_list(100)
    print(f"Sewage connections without CCB- prefix: {len(no_prefix_sewage)}")
    for s in no_prefix_sewage:
        print(f" - {s['ccb_report_number']}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_ccb_prefixes())
