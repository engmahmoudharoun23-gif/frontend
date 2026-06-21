import sys

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

endpoint_code = '''
@api_router.get("/reports/dashboard-stats-all")
async def get_dashboard_stats_all(
    month: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    # Determine allowed projects
    if current_user.role == "admin":
        projects_filter = {}
    elif current_user.projects or current_user.assigned_projects:
        allowed = list(set((current_user.projects or []) + (current_user.assigned_projects or [])))
        projects_filter = {"project": {"$in": allowed}}
    else:
        return {"projects": {}}

    query = {"is_deleted": {"$ne": True}}
    query.update(projects_filter)
    
    if month:
        query["created_at"] = {"$regex": f"^{month}"}
        
    pipeline = [
        {"$match": query},
        {"$group": {"_id": {"project": "$project", "status": "$status"}, "count": {"$sum": 1}}}
    ]
    
    stats = await reports_collection.aggregate(pipeline).to_list(None)
    
    # Process connections stats
    conn_query = {}
    conn_query.update(projects_filter)
    if month:
        conn_query["created_at"] = {"$regex": f"^{month}"}
    
    conn_pipeline = [
        {"$match": conn_query},
        {"$group": {"_id": {"project": "$project", "status": "$status"}, "count": {"$sum": 1}}}
    ]
    conn_stats = await db.connections.aggregate(conn_pipeline).to_list(None)
    
    # Aggregate by project
    project_stats = {}
    for s in stats:
        proj = s["_id"].get("project")
        status = s["_id"].get("status")
        if not proj: continue
        if proj not in project_stats:
            project_stats[proj] = {"reports": {}, "connections": {}}
        project_stats[proj]["reports"][status] = s["count"]
        
    for s in conn_stats:
        proj = s["_id"].get("project")
        status = s["_id"].get("status")
        if not proj: continue
        if proj not in project_stats:
            project_stats[proj] = {"reports": {}, "connections": {}}
        project_stats[proj]["connections"][status] = s["count"]
        
    return {"projects": project_stats}
'''

idx = content.find('@api_router.get("/reports/stats")')
if idx != -1:
    idx2 = content.find('@api_router', idx + 10)
    if idx2 != -1:
        new_content = content[:idx2] + endpoint_code + '\n' + content[idx2:]
        with open('backend/server.py', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Injected dashboard-stats-all endpoint!')
    else:
        print('Could not find next route.')
else:
    print('Could not find /reports/stats')
