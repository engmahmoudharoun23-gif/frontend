import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_deleted_reports():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    r = await db.permanently_deleted_reports.find_one()
    print(f"Deleted Report: {r}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_deleted_reports())
