import asyncio
import re
from motor.motor_asyncio import AsyncIOMotorClient

def get_loose_project_query(project_name: str) -> dict:
    # First, split by common separators like '-', '/', '|', '('
    parts = re.split(r'[-/|()]', project_name)
    main_part = parts[0].strip() if parts else project_name
    
    # Now tokenize the main part
    keywords = [k for k in re.split(r'\s+', main_part) if k]
    generic_words = ['مشروع', 'إصلاح', 'أعمال', 'بناء', 'عمليات', 'منطقة', 'بلدية', 'نظام']
    important_keywords = [k for k in keywords if k not in generic_words]
    search_keywords = important_keywords if important_keywords else keywords
    
    if not search_keywords:
        return {"$regex": re.escape(project_name), "$options": "i"}
        
    regex_parts = []
    for k in search_keywords:
        pattern = "(ال)?"
        k_no_al = k[2:] if k.startswith('ال') else k
        for char in k_no_al:
            if char in 'اأإآ': pattern += '[اأإآ]'
            elif char in 'هة': pattern += '[هة]'
            elif char in 'يى': pattern += '[يى]'
            else: pattern += re.escape(char)
        regex_parts.append(pattern)
        
    # We allow loose matches, so no strict start/end anchors unless they match the parts
    full_regex = r".*" + r".*".join(regex_parts) + r".*"
    return {"$regex": full_regex, "$options": "i"}

def get_loose_in_query(items, field_name="project"):
    if not items:
        return {}
    all_keywords = ["الكل", "جميع المحافظات", "كل المحافظات", "جميع المشاريع", "كل المشاريع"]
    if any(item in all_keywords for item in items):
        return {}
        
    clauses = []
    for item in items:
        if not item or item in all_keywords:
            continue
        q = get_loose_project_query(item)
        clauses.append({field_name: q})
        
    if not clauses:
        return {}
    if len(clauses) == 1:
        return clauses[0]
    return {"$or": clauses}

async def test():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    user_projs = [
        "مشروع المحافظات الغربية - القطاع الأوسط",
        "مشروع التشوة البصري",
        "مشروع كشف التسربات وإصلاحها"
    ]
    
    query = {"is_deleted": {"$ne": True}}
    proj_query = get_loose_in_query(user_projs, "project")
    if proj_query:
        query.update(proj_query)
        
    print("Loose Query generated:", query)
    
    reports = await db.quality_reports.find(query, {"_id": 0}).to_list(100)
    print(f"Found {len(reports)} matching quality reports:")
    for r in reports:
        print("- ID:", r.get("id"), "| Project:", r.get("project"), "| Governorate:", r.get("governorate"))
        
    client.close()

if __name__ == '__main__':
    asyncio.run(test())
