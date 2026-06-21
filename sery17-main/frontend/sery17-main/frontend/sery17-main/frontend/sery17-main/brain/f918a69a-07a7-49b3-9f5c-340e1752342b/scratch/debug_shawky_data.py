
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_data():
    load_dotenv()
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'wfm_reports')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Find user Mohamed Shawky
    user = await db.users.find_one({"full_name": {"$regex": "محمد شوقي", "$options": "i"}})
    if not user:
        print("User Mohamed Shawky not found")
        # Try searching by username if possible, but let's see
        user = await db.users.find_one({"username": {"$regex": "Shawky", "$options": "i"}})
    
    if user:
        print(f"Found user: {user.get('full_name')} (ID: {user.get('id')}, Username: {user.get('username')})")
        user_id = user.get('id')
        username = user.get('username')
        
        # Check reports created by him
        query = {"$or": [{"created_by": user_id}, {"created_by": username}]}
        count = await db.reports.count_documents(query)
        print(f"Total reports created by him: {count}")
        
        if count > 0:
            sample_reports = await db.reports.find(query).limit(5).to_list(5)
            for r in sample_reports:
                print(f"Report: ID={r.get('id')}, Project='{r.get('project')}', Gov='{r.get('governorate')}', CreatedAt={r.get('created_at')}")
        
        # Check project names in the database
        projects = await db.reports.distinct("project")
        print(f"Distinct projects in DB: {projects}")
        
    else:
        print("Mohamed Shawky not found at all.")

if __name__ == "__main__":
    asyncio.run(check_data())
