import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import re

def get_flexible_project_query(project_name: str) -> dict:
    if not project_name:
        return {}
    clean_name = project_name.replace('مشروع إصلاح أعمال', '').replace('مشروع', '').strip()
    clean_name = re.sub(r'\s*-\s*القطاع الأوسط$', '', clean_name).strip()
    words = clean_name.split()
    regex_parts = []
    for w in words:
        if w in ['القطاع', 'الأوسط', 'الاوسط']:
            continue
        k = re.sub(r'[^أ-يa-zA-Z0-9]', '', w)
        if not k:
            continue
        pattern = ''
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
    full_regex = r'^(مشروع\s+)?' + r'[\s\-_]*'.join(regex_parts) + r'.*$'
    return {'$regex': full_regex, '$options': 'i'}

q = get_flexible_project_query('مشروع إصلاح شبكات المياة والصرف المقاول الموسي')

async def check():
    client = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
    db = client['wfm_reports']
    reps = await db.reports.find({'project': q}).to_list(10)
    with open('scratch/test_reports.txt', 'w', encoding='utf-8') as f:
        f.write(f"Matched Reports Count: {len(reps)}\n")
        if reps:
            f.write(f"First match project: {reps[0].get('project')}\n")
        
        all_reps = await db.reports.find({'project': {'$regex': 'الموسي'}}).to_list(10)
        f.write(f"Reports with الموسي count: {len(all_reps)}\n")
        if all_reps:
            f.write(f"First raw match project: {all_reps[0].get('project')}\n")

asyncio.run(check())
