import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_leak_statuses():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    # البحث عن بلاغات كشف التسربات
    reports = await db.reports.find({"project": {"$regex": "كشف التسربات"}}, {"status": 1}).to_list(100)
    statuses = set(r.get("status") for r in reports if r.get("status"))
    print(f"Unique Statuses in Leak Detection: {statuses}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_leak_statuses())
