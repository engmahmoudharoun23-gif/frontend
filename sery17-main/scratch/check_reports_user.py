import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_reports():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    report = await db.reports.find_one()
    if report:
        print(f"Report User: {report.get('username') or report.get('user_id')}")
    else:
        print("No reports found.")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_reports())
