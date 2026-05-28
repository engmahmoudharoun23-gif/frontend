import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import re

async def verify_fix():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    project = "ايصال"
    project_pattern = project.replace('أ', '[أا]').replace('إ', '[إا]').replace('ا', '[اأإ]').replace(' ', '\\s+')
    regex_pattern = f"^(مشروع\\s+)?{project_pattern}$"
    
    water_filter = {
        "is_deleted": {"$ne": True},
        "project": {"$regex": regex_pattern, "$options": "i"}
    }
    
    count = await db.water_connections.count_documents(water_filter)
    print(f"Project '{project}' water connections count: {count}")
    
    project = "ايصال الرياض"
    project_pattern = project.replace('أ', '[أا]').replace('إ', '[إا]').replace('ا', '[اأإ]').replace(' ', '\\s+')
    regex_pattern = f"^(مشروع\\s+)?{project_pattern}$"
    
    water_filter = {
        "is_deleted": {"$ne": True},
        "project": {"$regex": regex_pattern, "$options": "i"}
    }
    count = await db.water_connections.count_documents(water_filter)
    print(f"Project '{project}' water connections count: {count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_fix())
