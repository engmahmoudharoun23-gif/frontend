import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clean_database():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # Cleaning collections that contribute to notifications
    res_r = await db.reports.delete_many({})
    res_w = await db.water_connections.delete_many({})
    res_s = await db.sewage_connections.delete_many({})
    res_support = await db.support_messages.delete_many({})
    res_inv = await db.invoices.delete_many({})
    res_req = await db.employee_requests.delete_many({})
    res_ext = await db.extracts.delete_many({})
    res_pdr = await db.permanently_deleted_reports.delete_many({})
    
    print(f"Deleted {res_r.deleted_count} reports")
    print(f"Deleted {res_w.deleted_count} water connections")
    print(f"Deleted {res_s.deleted_count} sewage connections")
    print(f"Deleted {res_support.deleted_count} support messages")
    print(f"Deleted {res_inv.deleted_count} invoices")
    print(f"Deleted {res_req.deleted_count} employee requests")
    print(f"Deleted {res_ext.deleted_count} extracts")
    print(f"Deleted {res_pdr.deleted_count} permanently deleted reports")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clean_database())
