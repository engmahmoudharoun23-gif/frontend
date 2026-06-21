import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
mongo_url = os.environ.get('MONGO_URL')

import sys
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

async def mock_get_pending_by_gov(db, current_user):
    base = {
        "is_deleted": {"$ne": True},
        "review_status": {"$in": ["بانتظار المراجعة", "قيد المراجعة", None]}
    }
    
    def get_projects(user, perm):
        allowed = []
        user_perms = user.get("permissions", [])
        proj_perms = user.get("project_permissions", {})
        if perm in user_perms:
            allowed.extend(user.get("projects", []))
        for p, perms in proj_perms.items():
            if perm in perms and p not in allowed:
                allowed.append(p)
        return allowed
        
    def get_flexible_in_query(values, field):
        if not values:
            return {}
        regex_patterns = []
        for val in values:
            parts = val.replace("مشروع ", "").strip().split()
            kws = [p for p in parts if len(p) > 2]
            if kws:
                regex_patterns.append(".*".join(kws))
            else:
                regex_patterns.append(val)
        return {field: {"$regex": f"({'|'.join(regex_patterns)})", "$options": "i"}}

    is_general_manager = False
    
    allowed_projects = set(get_projects(current_user, "reports_view")) | \
                       set(get_projects(current_user, "reports_review")) | \
                       set(get_projects(current_user, "reports_add"))
    
    governorates = current_user.get('governorates') or []
    
    query_parts = []
    
    if allowed_projects:
        p_query = get_flexible_in_query(list(allowed_projects), "project")
        if governorates:
            p_query["governorate"] = {"$in": governorates}
        query_parts.append(p_query)
    
    query_parts.append({"created_by": current_user['id']})
    
    query = {**base, "$or": query_parts}
    
    reports = await db.reports.find(query).to_list(100)
    print("Pending reports count:", len(reports))
    for r in reports:
        print(r.get('report_number'), r.get('project'), r.get('governorate'))

async def check():
    client = AsyncIOMotorClient(mongo_url)
    db = client.wfm_reports
    u = await db.users.find_one({'username': 'Eng Mahmoud Haroun'})
    await mock_get_pending_by_gov(db, u)

asyncio.run(check())
