import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017')
        db = client['wfm_reports']
        user_count = await db.users.count_documents({})
        report_count = await db.reports.count_documents({})
        project_count = await db.projects.count_documents({})
        print(f"Users: {user_count}")
        print(f"Reports: {report_count}")
        print(f"Projects: {project_count}")
        client.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
