
import motor.motor_asyncio
import asyncio
import re

def get_flexible_project_query(project_name):
    if not project_name: return None
    cleaned_name = re.sub(r'[\s\-_]+', ' ', project_name).strip()
    keywords = [k.strip() for k in cleaned_name.split() if len(k.strip()) > 1]
    generic_words = ['مشروع', 'إصلاح', 'أعمال', 'القطاع', 'الأوسط', 'بناء', 'عمليات', 'المحافظات', 'محافظات', 'منطقة', 'بلدية', 'نظام', 'الرياض']
    search_keywords = [k for k in keywords if k not in generic_words]
    if not search_keywords: search_keywords = keywords
    regex_parts = []
    for k in search_keywords:
        pattern = ""
        if k.startswith('ال'):
            pattern += '(ال)?'
            k_no_al = k[2:]
        else:
            pattern += '(ال)?'
            k_no_al = k
        for char in k_no_al:
            if char in 'اأإآ': pattern += '[اأإآ]'
            elif char in 'هة': pattern += '[هة]'
            elif char in 'يى': pattern += '[يى]'
            else: pattern += re.escape(char)
        regex_parts.append(pattern)
    return {"$regex": ".*".join(regex_parts), "$options": "i"}

async def test_admin_query():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    project = "مشروع المحافظات الغربية -القطاع الأوسط"
    regex_query = get_flexible_project_query(project)
    print(f"Regex Query: {regex_query}")
    
    query = {"is_deleted": {"$ne": True}}
    query["project"] = regex_query
    
    count = await db.reports.count_documents(query)
    print(f"Count: {count}")
    
    if count == 0:
        # Check why
        all_projs = await db.reports.distinct("project")
        print("All projects in DB:")
        for p in all_projs:
            print(f" - '{p}'")

asyncio.run(test_admin_query())
