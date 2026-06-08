from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime, timedelta, timezone

async def check_recent_connections():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    seventy_two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=72)
    cutoff_str = seventy_two_hours_ago.isoformat()
    
    print(f"Checking for connections after {cutoff_str}")
    
    # Check water
    water_count = await db.water_connections.count_documents({
        "$or": [
            {"created_at": {"$gte": cutoff_str}},
            {"added_at": {"$gte": seventy_two_hours_ago}}
        ]
    })
    print(f"Recent Water Connections: {water_count}")
    
    # Check sewage
    sewage_count = await db.sewage_connections.count_documents({
        "$or": [
            {"created_at": {"$gte": cutoff_str}},
            {"added_at": {"$gte": seventy_two_hours_ago}}
        ]
    })
    print(f"Recent Sewage Connections: {sewage_count}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_recent_connections())
