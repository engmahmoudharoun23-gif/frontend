import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import re

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    # Simulate Medhat Hussien or Admin
    user = await db.users.find_one({"username": "Eng Medhat Hussien"})
    if not user:
        print("User not found!")
        return
        
    print(f"Testing for {user['username']}")
    
    # 72 hours ago
    reference_time = datetime.fromisoformat('2026-05-26')
    seventy_two_hours_ago = reference_time - timedelta(hours=72)
    
    query = {"is_deleted": {"$ne": True}}
    
    # projects
    user_projects = user.get("projects", [])
    print("User projects:", user_projects)
    
    # get_flexible_in_query
    if user_projects:
        clauses = []
        for item in user_projects:
            parts = re.split(r'[-/|()]', item)
            main_part = parts[0].strip() if parts else item
            words = [w for w in main_part.split() if w not in ["مشروع", "اعمال", "أعمال", "اصلاح", "إصلاح", "تنفيذ"]]
            if words:
                pattern = ".*".join(words)
                clauses.append({"project": {"$regex": pattern, "$options": "i"}})
        if len(clauses) == 1:
            query.update(clauses[0])
        elif len(clauses) > 1:
            query.update({"$or": clauses})
            
    print("Query:", query)
    
    all_reports = await db.reports.find(query).to_list(1000)
    print("Found total reports for query:", len(all_reports))
    
    count = 0
    for report in all_reports:
        start_date_val = report.get("start_date")
        report_date = None
        if isinstance(start_date_val, datetime):
            report_date = start_date_val.replace(tzinfo=None)
        elif isinstance(start_date_val, str) and start_date_val:
            try: report_date = datetime.fromisoformat(start_date_val.replace("Z", "+00:00").split(".")[0])
            except: pass
            
        if report_date and report_date >= seventy_two_hours_ago:
            count += 1
            print("Matched report:", report.get("report_number"), report.get("project"), report_date)
            
    print("Total within 72h:", count)

asyncio.run(test())
