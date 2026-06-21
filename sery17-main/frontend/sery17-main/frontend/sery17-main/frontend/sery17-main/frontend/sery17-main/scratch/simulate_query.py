import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
import re

async def simulate_get_reports(project_name):
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    query = {"is_deleted": False}
    
    # Simulate the regex logic from server.py
    project = project_name
    if project:
        keywords = [k for k in project.replace('-', ' ').split() if len(k) > 1]
        if keywords:
            p_regex = ".*".join(keywords).replace('أ', '[أا]').replace('إ', '[إا]').replace('ا', '[اأإ]')
            regex_query = {"$regex": p_regex, "$options": "i"}
            query["project"] = regex_query
            
    print(f"QUERY: {query}")
    
    count = await db.reports.count_documents(query)
    print(f"COUNT: {count}")
    
    reports = await db.reports.find(query, {"_id": 0, "project": 1}).to_list(5)
    print(f"SAMPLES: {reports}")
    
    client.close()

if __name__ == "__main__":
    # Test with Western Governorate
    print("Testing Western Governorate:")
    asyncio.run(simulate_get_reports("مشروع المحافظات الغربية -القطاع الأوسط"))
    
    print("\nTesting Leak Detection:")
    asyncio.run(simulate_get_reports("مشروع كشف التسربات وإصلاحها"))
