import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
mongo_url = os.environ.get('MONGO_URL')

import sys
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

async def mock_get_unseen(db, current_user):
    is_admin = current_user.get('role') == "admin"
    
    # mock get_projects_with_permission
    def get_projects(user, perm):
        # same logic as server.py
        allowed = []
        user_perms = user.get("permissions", [])
        proj_perms = user.get("project_permissions", {})
        if perm in user_perms:
            allowed.extend(user.get("projects", []))
        for p, perms in proj_perms.items():
            if perm in perms and p not in allowed:
                allowed.append(p)
        return allowed
        
    report_projects = get_projects(current_user, "reports_notifications")
    governorates = current_user.get('governorates') or []
    
    reports = []
    if is_admin or report_projects:
        base_query = {
            "is_deleted": {"$ne": True},
            "$and": [
                {"$or": [
                    {"seen_by": {"$exists": False}},
                    {"seen_by": {"$ne": current_user['id']}}
                ]},
                {"$or": [
                    {"deleted_notifications": {"$exists": False}},
                    {"deleted_notifications": {"$ne": current_user['id']}}
                ]}
            ]
        }
        if not is_admin:
            expanded_reports = []
            for p in report_projects:
                expanded_reports.extend([p, f"مشروع {p}", p.replace("مشروع ", "").strip()])
            base_query["project"] = {"$in": expanded_reports}
            
            if governorates:
                expanded_govs = []
                for g in governorates:
                    clean_g = g.replace("محافظة ", "").replace("محافظه ", "").strip()
                    expanded_govs.extend([g, clean_g, f"محافظة {clean_g}", f"محافظه {clean_g}"])
                base_query["governorate"] = {"$in": expanded_govs}
                
        reports = await db.reports.find(base_query).to_list(300)
    
    print("Unseen reports count:", len(reports))
    for r in reports:
        print(r.get('report_number'), r.get('project'), r.get('governorate'))

async def check():
    client = AsyncIOMotorClient(mongo_url)
    db = client.wfm_reports
    u = await db.users.find_one({'username': 'Eng Mahmoud Haroun'})
    await mock_get_unseen(db, u)

asyncio.run(check())
