import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update ALL_PERMISSIONS to include business_reports
target_perm = '{"key": "quality_reports", "label": "تقارير الجودة", "group": "التقارير"}'
if target_perm not in content:
    # Let's find it case insensitively or with spaces
    print("Warning: exact quality_reports dict not found, searching with regex")
    pattern_perm = r'\{\s*"key"\s*:\s*"quality_reports"[^\}]+\}'
    match = re.search(pattern_perm, content)
    if match:
        target_perm = match.group(0)
    else:
        raise Exception("Could not find quality_reports in ALL_PERMISSIONS")

replacement_perm = target_perm + ',\n    {"key": "business_reports", "label": "تقارير الأعمال", "group": "التقارير"}'
content = content.replace(target_perm, replacement_perm)

# 2. Update PROJECT_SCOPED_PERMISSIONS to include business_reports
target_scoped = '"quality_reports"'
if target_scoped not in content:
    raise Exception("Could not find quality_reports in PROJECT_SCOPED_PERMISSIONS")

replacement_scoped = '"quality_reports", "business_reports"'
content = content.replace(target_scoped, replacement_scoped)

# 3. Add API endpoints right before "# Include router"
api_endpoints = """
# ========== Business Reports API ==========
@api_router.get("/business-reports")
async def get_business_reports(
    project: Optional[str] = None,
    governorate: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    user_doc = current_user if isinstance(current_user, dict) else current_user.dict()
    user_perms = set(user_doc.get("permissions", []))
    pp = user_doc.get("project_permissions", {})
    for plist in pp.values():
        user_perms.update(plist or [])
    if user_doc.get("role") != "admin" and "business_reports" not in user_perms:
        raise HTTPException(status_code=403, detail="Forbidden")
    query = {}
    if user_doc.get("role") != "admin":
        user_govs = user_doc.get("governorates", [])
        user_projs = user_doc.get("projects", [])
        
        # Apply governorate restriction
        if governorate:
            gov_query = get_flexible_in_query([governorate], "governorate")
            if gov_query:
                query.update(gov_query)
        elif user_govs:
            gov_query = get_flexible_in_query(user_govs, "governorate")
            if gov_query:
                query.update(gov_query)
                
        # Apply project restriction
        if project:
            proj_query = get_flexible_in_query([project], "project")
            if proj_query:
                query.update(proj_query)
        elif user_projs:
            proj_query = get_loose_in_query(user_projs, "project")
            if proj_query:
                query.update(proj_query)
    else:
        # Admin - no permission restrictions
        if project:
            proj_query = get_flexible_in_query([project], "project")
            if proj_query:
                query.update(proj_query)
        if governorate:
            gov_query = get_flexible_in_query([governorate], "governorate")
            if gov_query:
                query.update(gov_query)
                
    if date_from:
        query["date_from"] = {"$gte": date_from}
    if date_to:
        query["date_to"] = {"$lte": date_to}
        
    records = await db.business_reports.find(query, {"_id": 0}).sort("date_from", -1).to_list(500)
    return records


@api_router.post("/business-reports")
async def create_business_report(request: Request, current_user: User = Depends(get_current_user)):
    user_doc = current_user if isinstance(current_user, dict) else current_user.dict()
    user_perms = set(user_doc.get("permissions", []))
    pp = user_doc.get("project_permissions", {})
    for plist in pp.values():
        user_perms.update(plist or [])
    if user_doc.get("role") != "admin" and "business_reports" not in user_perms:
        raise HTTPException(status_code=403, detail="Forbidden")
    body = await request.json()
    record = {
        "id": str(uuid.uuid4()),
        "date_from": body.get("date_from", ""),
        "date_to": body.get("date_to", ""),
        "project": body.get("project", ""),
        "governorate": body.get("governorate", ""),
        "notes": body.get("notes", ""),
        "file_url": body.get("file_url", ""),
        "file_name": body.get("file_name", ""),
        "created_by": user_doc.get("username", ""),
        "created_at": datetime.utcnow().isoformat()
    }
    await db.business_reports.insert_one(record)
    record.pop("_id", None)
    return record


@api_router.put("/business-reports/{report_id}")
async def update_business_report(report_id: str, request: Request, current_user: User = Depends(get_current_user)):
    user_doc = current_user if isinstance(current_user, dict) else current_user.dict()
    user_perms = set(user_doc.get("permissions", []))
    pp = user_doc.get("project_permissions", {})
    for plist in pp.values():
        user_perms.update(plist or [])
    if user_doc.get("role") != "admin" and "business_reports" not in user_perms:
        raise HTTPException(status_code=403, detail="Forbidden")
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k in ["date_from", "date_to", "project", "governorate", "notes", "file_url", "file_name"]}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    await db.business_reports.update_one({"id": report_id}, {"$set": update_data})
    return {"message": "Success"}


@api_router.delete("/business-reports/{report_id}")
async def delete_business_report(report_id: str, current_user: User = Depends(get_current_user)):
    user_doc = current_user if isinstance(current_user, dict) else current_user.dict()
    user_perms = set(user_doc.get("permissions", []))
    pp = user_doc.get("project_permissions", {})
    for plist in pp.values():
        user_perms.update(plist or [])
    if user_doc.get("role") != "admin" and "business_reports" not in user_perms:
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.business_reports.delete_one({"id": report_id})
    return {"message": "Success"}


"""

target_include = "# Include router - MUST be after ALL endpoint definitions"
if target_include not in content:
    raise Exception("Could not find include router comment in server.py")

content = content.replace(target_include, api_endpoints + target_include)

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("backend/server.py updated successfully!")
