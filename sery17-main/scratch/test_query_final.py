import asyncio
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Import directly from the running codebase
sys.path.append('d:/sery17-main/sery17-main/backend')
from server import get_loose_in_query, get_flexible_in_query

query = {
    "consultant_note": {"$exists": True, "$ne": "", "$type": "string"},
    "is_deleted": {"$ne": True}
}

user_projs = ['مشروع المحافظات الغربية - القطاع الأوسط', 'مشروع التشوة البصري', 'مشروع كشف التسربات وإصلاحها']
user_govs = ['شقراء', 'ساجر', 'القصب', 'مرات']

proj_filter = get_loose_in_query(user_projs, "project")
gov_filter = get_flexible_in_query(user_govs, "governorate")

query["$and"] = [proj_filter, gov_filter]

print("GENERATED QUERY:")
print(query)

from motor.motor_asyncio import AsyncIOMotorClient
async def run():
    c = AsyncIOMotorClient('mongodb://localhost:27017')
    db = c['wfm_reports']
    res = await db.reports.find(query).to_list(None)
    print("MATCHES:", len(res))
    for r in res:
        print("REPORT:", r.get("report_number"), r.get("project"), r.get("governorate"), "NOTE:", r.get("consultant_note"))
    c.close()

asyncio.run(run())
