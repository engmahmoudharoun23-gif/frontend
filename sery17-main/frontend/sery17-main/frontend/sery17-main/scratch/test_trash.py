import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def test():
    # Connect to production DB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports  # correct database name
    
    print("Testing Water and Sewage Recycle Bin integrations directly in DB...")
    
    # 1. soft delete a water connection
    conn = await db.water_connections.find_one({"is_deleted": {"$ne": True}})
    if conn:
        print(f"Found active Water Connection: {conn.get('id')} - {conn.get('request_number')}")
        conn_id = conn.get('id')
        
        # Soft delete
        res = await db.water_connections.update_one(
            {"id": conn_id},
            {"$set": {
                "is_deleted": True,
                "deleted_at": datetime.now(timezone.utc).isoformat(),
                "deleted_by": "direct_test"
            }}
        )
        print(f"Soft deleted count: {res.modified_count}")
        
        # Query trash
        trashed = await db.water_connections.find({"is_deleted": True}).to_list(10)
        print(f"Trashed Water Connections in DB: {len(trashed)}")
        for t in trashed:
            print(f" - Trashed ID: {t.get('id')}, Request Num: {t.get('request_number')}, Deleted By: {t.get('deleted_by')}")
            
        # Restore
        res_restore = await db.water_connections.update_one(
            {"id": conn_id, "is_deleted": True},
            {"$unset": {"is_deleted": "", "deleted_at": "", "deleted_by": ""}}
        )
        print(f"Restored count: {res_restore.modified_count}")
    else:
        print("No active water connection found to test soft delete.")

if __name__ == "__main__":
    asyncio.run(test())
