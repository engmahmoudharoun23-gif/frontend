import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def standardize_ccb_prefixes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("Starting standardization of CCB prefixes...")

    # 1. Update Reports
    reports_to_update = await db.reports.find({"report_number": {"$not": {"$regex": "^CCB-"}}}).to_list(None)
    print(f"Updating {len(reports_to_update)} reports...")
    for r in reports_to_update:
        old_val = r["report_number"]
        new_val = f"CCB-{old_val}"
        await db.reports.update_one({"_id": r["_id"]}, {"$set": {"report_number": new_val}})
        print(f"  Report {r['id']}: {old_val} -> {new_val}")

    # 2. Update Water Connections
    water_to_update = await db.water_connections.find({
        "ccb_report_number": {"$not": {"$regex": "^CCB-"}},
        "ccb_report_number": {"$ne": "", "$exists": True}
    }).to_list(None)
    print(f"Updating {len(water_to_update)} water connections...")
    for w in water_to_update:
        old_val = w["ccb_report_number"]
        # Skip if it's just symbols or empty after stripping
        if not old_val or old_val.strip() == "":
            continue
        new_val = f"CCB-{old_val}"
        await db.water_connections.update_one({"_id": w["_id"]}, {"$set": {"ccb_report_number": new_val}})
        print(f"  Water Conn {w.get('id', 'N/A')}: {old_val} -> {new_val}")

    # 3. Update Sewage Connections
    sewage_to_update = await db.sewage_connections.find({
        "ccb_report_number": {"$not": {"$regex": "^CCB-"}},
        "ccb_report_number": {"$ne": "", "$exists": True}
    }).to_list(None)
    print(f"Updating {len(sewage_to_update)} sewage connections...")
    for s in sewage_to_update:
        old_val = s["ccb_report_number"]
        if not old_val or old_val.strip() == "":
            continue
        new_val = f"CCB-{old_val}"
        await db.sewage_connections.update_one({"_id": s["_id"]}, {"$set": {"ccb_report_number": new_val}})
        print(f"  Sewage Conn {s.get('id', 'N/A')}: {old_val} -> {new_val}")

    print("Standardization complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(standardize_ccb_prefixes())
