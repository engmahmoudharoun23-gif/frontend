import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def final_aggressive_cleanup():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("Starting aggressive database cleanup...")

    def clean_val(val):
        if not val: return ""
        # Extract only digits
        digits = "".join([c for c in str(val) if c.isdigit()])
        if digits:
            return f"CCB-{digits}"
        return ""

    # 1. Reports
    async for r in db.reports.find({"report_number": {"$exists": True}}):
        old = r.get("report_number", "")
        new = clean_val(old)
        if new and old != new:
            await db.reports.update_one({"_id": r["_id"]}, {"$set": {"report_number": new}})
            print(f"Report: '{old}' -> '{new}'")

    # 2. Water Connections
    async for w in db.water_connections.find({"ccb_report_number": {"$exists": True}}):
        old = w.get("ccb_report_number", "")
        new = clean_val(old)
        if new and old != new:
            await db.water_connections.update_one({"_id": w["_id"]}, {"$set": {"ccb_report_number": new}})
            print(f"Water: '{old}' -> '{new}'")

    # 3. Sewage Connections
    async for s in db.sewage_connections.find({"ccb_report_number": {"$exists": True}}):
        old = s.get("ccb_report_number", "")
        new = clean_val(old)
        if new and old != new:
            await db.sewage_connections.update_one({"_id": s["_id"]}, {"$set": {"ccb_report_number": new}})
            print(f"Sewage: '{old}' -> '{new}'")

    print("Cleanup complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(final_aggressive_cleanup())
