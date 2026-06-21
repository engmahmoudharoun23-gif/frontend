import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check_api_logic():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    project = "ايصال"
    # Logic from server.py
    project_pattern = project.replace('أ', '[أا]').replace('إ', '[إا]').replace('ا', '[اأإ]').replace(' ', '\\s+')
    regex_pattern = f"^(مشروع\\s+)?{project_pattern}$"
    
    water_filter = {"is_deleted": {"$ne": True}}
    water_filter["project"] = {"$regex": regex_pattern, "$options": "i"}
    
    # Simulating the month filter if any
    # month = "2026-05"
    # ... (skipping for now to see total)
    
    count = await db.water_connections.count_documents(water_filter)
    print(f"Total Water Connections for '{project}': {count}")
    
    # Check with month
    month = "2026-05"
    month_regex = f"^{month}"
    date_fields = ["created_at", "added_at", "work_order_date"]
    date_filters = []
    for field in date_fields:
        date_filters.append({
            "$or": [
                {field: {"$regex": month_regex}},
                # (skipping date objects for simplicity as we saw they are strings)
            ]
        })
    month_query = {"$or": date_filters}
    
    water_filter_with_month = {"$and": [water_filter, month_query]}
    count_month = await db.water_connections.count_documents(water_filter_with_month)
    print(f"May 2026 Water Connections for '{project}': {count_month}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_api_logic())
