
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
        pattern = "(ال)?"
        k_no_al = k[2:] if k.startswith('ال') else k
        for char in k_no_al:
            if char in 'اأإآ': pattern += '[اأإآ]'
            elif char in 'هة': pattern += '[هة]'
            elif char in 'يى': pattern += '[يى]'
            else: pattern += re.escape(char)
        regex_parts.append(pattern)
    return {"$regex": ".*".join(regex_parts), "$options": "i"}

async def delete_project_reports():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    projects_to_clear = ["المحافظات الغربية", "كشف التسربات"]
    total_deleted = 0
    
    for p_name in projects_to_clear:
        regex = get_flexible_project_query(p_name)
        query = {"project": regex}
        
        # Count before
        count = await db.reports.count_documents(query)
        print(f"Found {count} reports for project '{p_name}' matching {regex}")
        
        if count > 0:
            result = await db.reports.update_many(query, {"$set": {"is_deleted": True}})
            print(f"Successfully marked {result.modified_count} reports as deleted.")
            total_deleted += result.modified_count
            
        # Also check connections if any
        for coll in ["water_connections", "sewage_connections"]:
            c_count = await db[coll].count_documents(query)
            if c_count > 0:
                c_result = await db[coll].update_many(query, {"$set": {"is_deleted": True}})
                print(f"Marked {c_result.modified_count} connections in '{coll}' as deleted.")
    
    print(f"\nTask Complete. Total records hidden: {total_deleted}")

asyncio.run(delete_project_reports())
