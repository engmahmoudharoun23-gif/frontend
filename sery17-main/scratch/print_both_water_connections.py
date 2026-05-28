import motor.motor_asyncio
import asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    cursor = db.water_connections.find({"project": "مشروع ايصال"})
    async for doc in cursor:
        print(f"ID: {doc.get('id')}, Gov: {doc.get('governorate')}, Customer: {doc.get('customer_name')}, CreatedBy: {doc.get('created_by')}, Deleted: {doc.get('is_deleted')}, Active: {doc.get('is_active')}, Status: {doc.get('request_status') or doc.get('status')}")

if __name__ == "__main__":
    asyncio.run(main())
