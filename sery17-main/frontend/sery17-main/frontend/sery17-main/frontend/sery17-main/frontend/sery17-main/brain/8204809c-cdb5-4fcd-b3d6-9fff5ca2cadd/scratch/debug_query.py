
import motor.motor_asyncio
import asyncio
import re

def get_flexible_project_query(project_name):
    if not project_name: return None
    cleaned_name = project_name.replace('-', ' ').replace('_', ' ')
    keywords = [k.strip() for k in cleaned_name.split() if len(k.strip()) > 1]
    generic_words = ['مشروع', 'إصلاح', 'أعمال', 'القطاع', 'الأوسط', 'بناء', 'عمليات', 'المحافظات', 'محافظات', 'منطقة', 'بلدية']
    search_keywords = [k for k in keywords if k not in generic_words]
    if not search_keywords: search_keywords = keywords
    regex_parts = []
    for k in search_keywords:
        pattern = ""
        for char in k:
            if char in 'اأإآ': pattern += '[اأإآ]'
            elif char in 'هة': pattern += '[هة]'
            elif char in 'يى': pattern += '[يى]'
            else: pattern += re.escape(char)
        regex_parts.append(pattern)
    return {"$regex": ".*".join(regex_parts), "$options": "i"}

async def debug_query():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    project_requested = "المحافظات الغربية"
    regex_query = get_flexible_project_query(project_requested)
    print(f"Requested: '{project_requested}'")
    print(f"Regex: {regex_query}")
    
    # Simulate Level 2 Manager query
    query = {
        "is_deleted": {"$ne": True},
        "project": regex_query
    }
    
    count = await db.reports.count_documents(query)
    print(f"Total reports found with this query: {count}")
    
    if count > 0:
        sample = await db.reports.find_one(query)
        print(f"Sample report project: '{sample.get('project')}'")

asyncio.run(debug_query())
