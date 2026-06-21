import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import re

async def master_cleanup():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("STARTING MASTER CLEANUP...")

    def clean_and_prefix(val):
        if not val: return None
        # Extract only numeric digits
        digits = "".join(filter(str.isdigit, str(val)))
        if digits:
            return f"CCB-{digits}"
        # If no digits, maybe it has some text we want to keep?
        # Let's just remove CCB- (case insensitive) and non-alphanumeric, then add CCB-
        cleaned = re.sub(r'(?i)CCB-', '', str(val))
        cleaned = re.sub(r'[^a-zA-Z0-9]', '', cleaned)
        if cleaned:
            return f"CCB-{cleaned}"
        return None

    # 1. Reports
    reports_fixed = 0
    async for r in db.reports.find({"is_deleted": False}):
        old = r.get("report_number")
        new = clean_and_prefix(old)
        if new and old != new:
            await db.reports.update_one({"_id": r["_id"]}, {"$set": {"report_number": new}})
            reports_fixed += 1
            print(f"  [Report] Fixed: {old} -> {new}")

    # 2. Water
    water_fixed = 0
    async for w in db.water_connections.find():
        old = w.get("ccb_report_number")
        new = clean_and_prefix(old)
        if new and old != new:
            await db.water_connections.update_one({"_id": w["_id"]}, {"$set": {"ccb_report_number": new}})
            water_fixed += 1
            print(f"  [Water] Fixed: {old} -> {new}")

    # 3. Sewage
    sewage_fixed = 0
    async for s in db.sewage_connections.find():
        old = s.get("ccb_report_number")
        new = clean_and_prefix(old)
        if new and old != new:
            await db.sewage_connections.update_one({"_id": s["_id"]}, {"$set": {"ccb_report_number": new}})
            sewage_fixed += 1
            print(f"  [Sewage] Fixed: {old} -> {new}")

    print("\nCLEANUP COMPLETE!")
    print(f"Total Reports Fixed: {reports_fixed}")
    print(f"Total Water Connections Fixed: {water_fixed}")
    print(f"Total Sewage Connections Fixed: {sewage_fixed}")
    
    print("\n--- FIRST 10 REPORTS NOW ---")
    async for r in db.reports.find({"is_deleted": False}).limit(10):
        print(f"  {r.get('report_number')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(master_cleanup())
