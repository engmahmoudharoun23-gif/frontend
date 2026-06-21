from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import sys

# Ensure UTF-8 output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

async def list_all_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = await db.reports.distinct("project")
    print(f"Distinct Projects in DB: {projects}")
    
    for p in projects:
        count = await db.reports.count_documents({"project": p})
        print(f"Project: {p} -> Count: {count}")

    client.close()

if __name__ == "__main__":
    asyncio.run(list_all_projects())
