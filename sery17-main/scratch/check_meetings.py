import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL="mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    DB_NAME="wfm_reports"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    meetings = await db.meetings.find({}).sort("created_at", -1).limit(3).to_list(3)
    for m in meetings:
        print(f"Meeting ID: {m.get('id')}")
        print(f"Images: {m.get('images')}")
        print(f"PDFs: {m.get('pdf_paths')} or PDF: {m.get('pdf_path')}")
        print("---")

if __name__ == "__main__":
    asyncio.run(main())
