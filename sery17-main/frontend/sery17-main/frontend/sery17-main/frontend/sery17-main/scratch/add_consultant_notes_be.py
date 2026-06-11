import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add to ALL_PERMISSIONS
if '"consultant_notes"' not in content:
    target1 = '{"key": "reports_notifications", "label": "إشعارات البلاغات الجديدة", "group": "البلاغات"},'
    replacement1 = target1 + '\n    {"key": "consultant_notes", "label": "ملاحظات الاستشاري", "group": "البلاغات"},'
    content = content.replace(target1, replacement1)

# 2. Add to PROJECT_SCOPED_PERMISSIONS
if '"consultant_notes"' in content and '"consultant_notes"' not in content.split('PROJECT_SCOPED_PERMISSIONS = {')[1].split('}')[0]:
    target2 = '"reports_notifications",'
    replacement2 = '"reports_notifications", "consultant_notes",'
    content = content.replace(target2, replacement2, 1)

# 3. Add the endpoint
endpoint_code = """
@api_router.get("/reports/consultant-notes")
async def get_consultant_notes(
    project: str = Query(None),
    governorate: str = Query(None),
    current_user: User = Depends(get_current_user)
):
    user_doc = current_user if isinstance(current_user, dict) else current_user.dict()
    user_perms = set(user_doc.get("permissions", []))
    pp = user_doc.get("project_permissions", {})
    role = user_doc.get("role")
    
    # Check if user has consultant_notes permission
    if role != "admin":
        has_perm = False
        if "consultant_notes" in user_perms:
            has_perm = True
        else:
            for p in pp.values():
                if "consultant_notes" in p:
                    has_perm = True
                    break
        if not has_perm:
            raise HTTPException(status_code=403, detail="Forbidden")
            
    # Base query
    query = {
        "consultant_note": {"$exists": True, "$ne": "", "$type": "string"},
        "is_deleted": {"$ne": True}
    }
    
    user_projs = user_doc.get("projects", [])
    user_govs = user_doc.get("governorates", [])
    
    if role != "admin":
        if role == "level3":
            query["created_by"] = user_doc.get("id")
        else:
            if not project and user_projs:
                from server import get_loose_in_query
                query.update(get_loose_in_query(user_projs, "project"))
            elif project:
                from server import get_flexible_in_query
                query.update(get_flexible_in_query([project], "project"))
            
            if not governorate and user_govs:
                from server import get_flexible_in_query
                query.update(get_flexible_in_query(user_govs, "governorate"))
            elif governorate:
                from server import get_flexible_in_query
                query.update(get_flexible_in_query([governorate], "governorate"))
    else:
        if project:
            from server import get_flexible_in_query
            query.update(get_flexible_in_query([project], "project"))
        if governorate:
            from server import get_flexible_in_query
            query.update(get_flexible_in_query([governorate], "governorate"))

    reports = await db.reports.find(
        query, 
        {"id": 1, "report_number": 1, "project": 1, "governorate": 1, "consultant_note": 1, "created_at": 1, "status": 1}
    ).sort("created_at", -1).to_list(200)
    
    return {"reports": reports}

"""

if '/reports/consultant-notes' not in content:
    content = content.replace('app.include_router(api_router)', endpoint_code + '\napp.include_router(api_router)')

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend updated.")
