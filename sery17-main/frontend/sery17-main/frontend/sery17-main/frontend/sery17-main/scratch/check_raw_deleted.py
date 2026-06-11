import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.wfm_db
    doc = await db.reports.find_one({'is_deleted': True})
    print("Report:", doc)
    
    inv = await db.invoices.find_one({'is_deleted': True})
    print("Invoice:", inv)
    
    req = await db.employee_requests.find_one({'is_deleted': True})
    print("Request:", req)

if __name__ == "__main__":
    asyncio.run(check())
