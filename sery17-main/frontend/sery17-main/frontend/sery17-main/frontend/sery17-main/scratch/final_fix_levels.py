import motor.motor_asyncio
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

async def fix():
    env_path = Path('backend/.env')
    load_dotenv(env_path)
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'wfm_reports')
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get all projects
    projects_cursor = db.projects.find({}, {"name": 1})
    all_projects = []
    async for p in projects_cursor:
        if p.get("name"):
            all_projects.append(p["name"])
    
    print(f"Found projects: {all_projects}")
    
    # Update Mahmoud (Level 3)
    res_m = await db.users.update_one(
        {"username": "Eng Mahmoud"}, 
        {"$set": {
            "level": "3", 
            "projects": all_projects, 
            "project_permissions": {p: ["reports_review"] for p in all_projects}
        }}
    )
    print(f"Updated Mahmoud: {res_m.modified_count}")
    
    # Update Medhat (Level 2)
    res_md = await db.users.update_one(
        {"username": "Eng Medhat Hussain"}, 
        {"$set": {
            "level": "2", 
            "projects": all_projects, 
            "project_permissions": {p: ["reports_review"] for p in all_projects}
        }}
    )
    print(f"Updated Medhat: {res_md.modified_count}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(fix())
