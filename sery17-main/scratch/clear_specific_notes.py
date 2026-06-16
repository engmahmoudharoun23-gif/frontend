import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_notes():
    client = AsyncIOMotorClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0", tlsCAFile=certifi.where())
    db = client.wfm_reports
    
    report_numbers = ["CCB-98431106011115", "CCB-53438437613992"]
    
    reports = await db.reports.find({"report_number": {"$in": report_numbers}}).to_list(None)
    print(f"Found {len(reports)} reports matching the numbers.")
    
    result = await db.reports.update_many(
        {"report_number": {"$in": report_numbers}},
        {"$set": {
            "notes": "",
            "report_note_replies": [],
            "report_note_reply": "",
            "report_note_replied_by": "",
            "report_note_processed": False,
            "consultant_note": "",
            "consultant_note_replies": [],
            "consultant_note_processed": False
        }}
    )
    print(f"Modified {result.modified_count} reports.")
    
if __name__ == "__main__":
    asyncio.run(clear_notes())
