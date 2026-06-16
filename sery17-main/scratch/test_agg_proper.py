import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import re

mongo_url = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = AsyncIOMotorClient(mongo_url)
db = client['wfm_reports']

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

async def check():
    for p in ['مشروع المحافظات الغربية', 'مشروع كشف التسربات وإصلاحها', 'مشروع التشوة البصري', 'مشروع إصلاح شبكات المياة والصرف المقاول الموسي']:
        try:
            q = {'project': get_flexible_project_query(p)}
            res = await db.reports.aggregate([{'$match': q}, {'$count': 'total'}]).to_list(1)
            print(f'Success for {p}: {res}')
        except Exception as e:
            print(f'Error for {p}: {e}')

asyncio.run(check())
