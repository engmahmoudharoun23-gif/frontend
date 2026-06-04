
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all_trash_counts():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    base_query = {"is_deleted": True, "deleted_by": {"$exists": True}}
    
    invoices_count = await db.invoices.count_documents(base_query)
    requests_count = await db.employee_requests.count_documents(base_query)
    reports_count = await db.reports.count_documents(base_query)
    
    print(f"Invoices: {invoices_count}")
    print(f"Requests: {requests_count}")
    print(f"Reports: {reports_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_all_trash_counts())
