import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta, timezone

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.wfm_reports
    
    # Simulate the filter logic for a month with NO data (e.g. 2024-04)
    month = "2024-04"
    month_regex = f"^{month}"
    from datetime import datetime as dt
    year, month_num = month.split('-')
    start_date = dt(int(year), int(month_num), 1, tzinfo=timezone.utc)
    end_date = dt(int(year), int(month_num) + 1, 1, tzinfo=timezone.utc)
    
    date_fields = ["created_at", "work_order_date", "commissioning_date", "start_date"]
    or_conditions = []
    for field in date_fields:
        or_conditions.append({field: {"$regex": month_regex}})
        or_conditions.append({field: {"$gte": start_date, "$lt": end_date}})
    
    date_filter = {"$or": or_conditions}
    
    # THE BIG REASON: if water_filter has an $and, we must check it correctly
    water_filter = {"$and": [date_filter]}
    
    count = await db.water_connections.count_documents(water_filter)
    print(f"DEBUG: Total Water Connections for {month} with filter {water_filter}: {count}")
    
    # Check all records to see what dates they HAVE
    print("\nSample records from the DB:")
    cursor = db.water_connections.find({}, {"project": 1, "created_at": 1, "work_order_date": 1}).limit(10)
    async for doc in cursor:
        print(doc)

    client.close()

if __name__ == "__main__":
    asyncio.run(main())
