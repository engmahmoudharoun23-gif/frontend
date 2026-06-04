import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

endpoint_code = """
@api_router.get("/dashboard/init-all")
async def dashboard_init_all(
    month: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime as dt
    
    # 1. Determine allowed projects
    if current_user.role == "admin":
        allowed_projects = [] # Admin gets all projects dynamically from DB
        try:
            projects_cursor = db.projects.find({"is_deleted": {"$ne": True}})
            async for p in projects_cursor:
                if "name" in p:
                    allowed_projects.append(p["name"])
        except Exception:
            pass
    else:
        allowed_projects = list(set((getattr(current_user, 'projects', []) or []) + (getattr(current_user, 'assigned_projects', []) or [])))

    # 2. Build filters
    query_filter = {"is_deleted": {"$ne": True}}
    hierarchy_filter = await get_hierarchy_filter(current_user)
    query_filter.update(hierarchy_filter)
    
    if current_user.role != "admin" and allowed_projects:
        query_filter.update(get_flexible_in_query(allowed_projects, "project"))

    if month:
        year, month_num = month.split('-')
        date_from_obj = dt(int(year), int(month_num), 1, 0, 0, 0)
        if int(month_num) == 12:
            date_to_obj = dt(int(year) + 1, 1, 1, 0, 0, 0)
        else:
            date_to_obj = dt(int(year), int(month_num) + 1, 1, 0, 0, 0)
            
        start_str = f"{month}-01T00:00:00"
        end_str = date_to_obj.strftime("%Y-%m-%dT00:00:00")
        
        date_filter = {
            "$or": [
                {"created_at": {"$gte": start_str, "$lt": end_str}},
                {"created_at": {"$gte": date_from_obj, "$lt": date_to_obj}}
            ]
        }
        if "$or" in query_filter:
            query_filter["$and"] = [{"$or": query_filter.pop("$or")}, date_filter]
        else:
            query_filter.update(date_filter)

    # 3. Aggregate Reports with single $group
    pipeline = [
        {'$match': query_filter},
        {
            '$group': {
                '_id': {'project': '$project', 'report_type': '$report_type'},
                'total': {'$sum': 1},
                'fixed': {'$sum': {'$cond': [{'$eq': ['$status', 'تم الإصلاح']}, 1, 0]}},
                'asphalt_remaining': {'$sum': {'$cond': [{'$in': ['$status', ['بانتظار الأسفلت', 'تم الإصلاح-بانتظار الأسفلت']]}, 1, 0]}},
                'licensed': {'$sum': {'$cond': [{'$regexMatch': {'input': {'$ifNull': ['$license_number', '']}, 'regex': '[0-9]'}}, 1, 0]}},
                'unlicensed': {'$sum': {'$cond': [{'$not': {'$regexMatch': {'input': {'$ifNull': ['$license_number', '']}, 'regex': '[0-9]'}}}, 1, 0]}},
            }
        }
    ]
    
    grouped_results = await db.reports.aggregate(pipeline).to_list(None)
    
    # 4. Aggregate Connections
    conn_filter = query_filter.copy()
    conn_pipeline = [
        {'$match': conn_filter},
        {'$group': {'_id': '$project', 'count': {'$sum': 1}}}
    ]
    conn_results = await db.connections.aggregate(conn_pipeline).to_list(None)
    
    # Process results into output format
    projects_data = {}
    
    for g in grouped_results:
        proj = g.get('_id', {}).get('project', '')
        if not proj: continue
        if proj not in projects_data:
            projects_data[proj] = {
                'total': 0, 'fixed': 0, 'asphalt_remaining': 0,
                'licensed': 0, 'unlicensed': 0,
                'tile_licensed': 0, 'tile_unlicensed': 0,
                'terrestrial_licensed': 0, 'terrestrial_unlicensed': 0,
                'terrestrial': 0, 'tile': 0, 'asphalt': 0,
                'by_type': {}, 'connections': 0, 'cards': []
            }
            if current_user.role == "admin" and proj not in allowed_projects:
                allowed_projects.append(proj)
                
        p_data = projects_data[proj]
        rtype = g.get('_id', {}).get('report_type', '')
        
        t = g.get('total', 0)
        p_data['total'] += t
        p_data['fixed'] += g.get('fixed', 0)
        p_data['asphalt_remaining'] += g.get('asphalt_remaining', 0)
        
        if rtype:
            p_data['by_type'][rtype] = t
            
        is_asphalt = rtype in ['أسفلت', 'اسفلت', 'asphalt', 'Asphalt']
        is_tile = rtype in ['بلاط', 'tile', 'Tile']
        is_terr = rtype in ['ترابي', 'terrestrial', 'Terrestrial']
        
        if is_asphalt:
            p_data['asphalt'] += t
            p_data['licensed'] += g.get('licensed', 0)
            p_data['unlicensed'] += g.get('unlicensed', 0)
        elif is_tile:
            p_data['tile'] += t
            p_data['tile_licensed'] += g.get('licensed', 0)
            p_data['tile_unlicensed'] += g.get('unlicensed', 0)
        elif is_terr:
            p_data['terrestrial'] += t
            p_data['terrestrial_licensed'] += g.get('licensed', 0)
            p_data['terrestrial_unlicensed'] += g.get('unlicensed', 0)

    for c in conn_results:
        proj = c.get('_id', '')
        if not proj: continue
        if proj in projects_data:
            projects_data[proj]['connections'] = c.get('count', 0)
        else:
            projects_data[proj] = {
                'total': 0, 'fixed': 0, 'asphalt_remaining': 0,
                'licensed': 0, 'unlicensed': 0,
                'tile_licensed': 0, 'tile_unlicensed': 0,
                'terrestrial_licensed': 0, 'terrestrial_unlicensed': 0,
                'terrestrial': 0, 'tile': 0, 'asphalt': 0,
                'by_type': {}, 'connections': c.get('count', 0), 'cards': []
            }
            if current_user.role == "admin" and proj not in allowed_projects:
                allowed_projects.append(proj)

    return {
        "allowed_projects": allowed_projects,
        "projects": projects_data
    }
"""

if "/dashboard/init-all" not in content:
    idx = content.find('@api_router.get("/reports/stats")')
    if idx != -1:
        new_content = content[:idx] + endpoint_code + '\n' + content[idx:]
        with open('backend/server.py', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Injected /dashboard/init-all successfully!")
    else:
        print("Could not find /reports/stats")
else:
    print("/dashboard/init-all already exists.")
