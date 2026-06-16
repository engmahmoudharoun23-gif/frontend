import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def main():
    client = AsyncIOMotorClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client["wfm_reports"]
    # Get flexible project query for "مشروع المحافظات الغربية"
    import re
    def normalize_arabic(text):
        res = str(text).strip()
        res = re.sub(r'\s+', ' ', res)
        res = res.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
        res = res.replace('ة', 'ه')
        res = res.replace('ى', 'ي')
        return res

    project_name = "مشروع المحافظات الغربية"
    parts = re.split(r'[-/|()]', project_name)
    main_part = parts[0].strip() if parts else project_name
    keywords = [k for k in re.split(r'\s+', main_part) if k]
    generic_words = ['مشروع', 'إصلاح', 'أعمال', 'بناء', 'عمليات', 'منطقة', 'بلدية', 'نظام']
    important_keywords = [k for k in keywords if k not in generic_words]
    search_keywords = important_keywords if important_keywords else keywords
    
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
        
    full_regex = r".*" + r".*".join(regex_parts) + r".*"
    q = {"$regex": full_regex, "$options": "i"}
    
    count = await db.reports.count_documents({"project": q})
    print("Match count loose:", count)
    
    print("Distinct projects:")
    projects = await db.reports.distinct("project")
    print(projects)

asyncio.run(main())
