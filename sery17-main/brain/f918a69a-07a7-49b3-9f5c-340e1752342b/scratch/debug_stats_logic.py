
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timedelta

async def debug_stats():
    env_path = Path("d:/sery17-main/sery17-main/backend/.env")
    load_dotenv(dotenv_path=env_path)
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    
    # Simulate a user (Admin)
    project = "المحافظات الغربية"
    month = "2026-05"
    
    # --- Exact logic from server.py ---
    query_filter = {"is_deleted": {"$ne": True}}
    
    # Flexible project query
    def get_flexible_project_query(p):
        parts = [k for k in p.replace('-', ' ').split() if len(k) > 2]
        return {"$regex": ".*".join(parts), "$options": "i"}

    query_filter["project"] = get_flexible_project_query(project)
    
    # Month logic
    year, month_num = month.split('-')
    from datetime import datetime as dt
    date_from_obj = dt(int(year), int(month_num), 1, 0, 0, 0)
    if int(month_num) == 12:
        date_to_obj = dt(int(year) + 1, 1, 1, 0, 0, 0)
    else:
        date_to_obj = dt(int(year), int(month_num) + 1, 1, 0, 0, 0)
    
    start_str = f"{month}-01T00:00:00"
    end_str = date_to_obj.strftime("%Y-%m-%dT00:00:00")
    
    date_filter = {
        "$or": [
            {"created_at": {"$gte": start_str, "$lt": end_str}},
            {"created_at": {"$gte": date_from_obj, "$lt": date_to_obj}}
        ]
    }
    query_filter.update(date_filter)
    
    print(f"DEBUG QUERY: {query_filter}")
    
    count = await db.reports.count_documents(query_filter)
    print(f"Result count: {count}")
    
    # Check if reports exist at all for this project
    count_all_proj = await db.reports.count_documents({"project": query_filter["project"]})
    print(f"Total in project (no date/deleted): {count_all_proj}")

if __name__ == "__main__":
    asyncio.run(debug_stats())
