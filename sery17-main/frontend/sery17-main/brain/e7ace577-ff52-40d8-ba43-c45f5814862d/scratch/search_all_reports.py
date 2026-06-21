from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

async def search_reports():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Searching All Reports ---")
    async for report in db.reports.find().limit(100):
        project = report.get('project', 'N/A')
        category = report.get('category', 'N/A')
        print(f"Report ID: {report.get('id')} | Project: {project} | Category: {category}")

    print("\n--- Searching Deleted Reports ---")
    async for report in db.deleted_reports.find():
        project = report.get('project', 'N/A')
        category = report.get('category', 'N/A')
        print(f"DELETED Report ID: {report.get('id')} | Project: {project} | Category: {category}")

    client.close()

if __name__ == "__main__":
    asyncio.run(search_reports())
