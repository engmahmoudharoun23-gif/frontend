import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the get_reports_stats function
pattern = r'(@api_router\.get\("/reports/stats"\)\s*async def get_reports_stats.*?)(?=@api_router\.get)'
match = re.search(pattern, content, flags=re.DOTALL)

if not match:
    print("Could not find get_reports_stats function!")
else:
    original_func = match.group(1)
    
    # Let's find the pipeline part
    pipeline_start_idx = original_func.find('pipeline = [')
    allow_disk_use_idx = original_func.find('conn_filter = query_filter.copy()')
    
    if pipeline_start_idx != -1 and allow_disk_use_idx != -1:
        new_pipeline_code = """    pipeline = [
        {'$match': query_filter},
        {
            '$group': {
                '_id': '$report_type',
                'total': {'$sum': 1},
                'fixed': {'$sum': {'$cond': [{'$eq': ['$status', 'تم الإصلاح']}, 1, 0]}},
                'asphalt_remaining': {'$sum': {'$cond': [{'$in': ['$status', ['بانتظار الأسفلت', 'تم الإصلاح-بانتظار الأسفلت']]}, 1, 0]}},
                'licensed': {'$sum': {'$cond': [{'$regexMatch': {'input': {'$ifNull': ['$license_number', '']}, 'regex': '[0-9]'}}, 1, 0]}},
                'unlicensed': {'$sum': {'$cond': [{'$not': {'$regexMatch': {'input': {'$ifNull': ['$license_number', '']}, 'regex': '[0-9]'}}}, 1, 0]}},
            }
        }
    ]
    
    grouped_results = await db.reports.aggregate(pipeline).to_list(None)
    
    total = 0
    fixed = 0
    asphalt_remaining = 0
    by_type = {}
    
    asphalt = {'total': 0, 'licensed': 0, 'unlicensed': 0}
    tile = {'total': 0, 'licensed': 0, 'unlicensed': 0}
    terrestrial = {'total': 0, 'licensed': 0, 'unlicensed': 0}
    
    for g in grouped_results:
        rtype = g.get('_id', '')
        t = g.get('total', 0)
        total += t
        fixed += g.get('fixed', 0)
        asphalt_remaining += g.get('asphalt_remaining', 0)
        
        if rtype:
            by_type[rtype] = t
            
        is_asphalt = rtype in ['أسفلت', 'اسفلت', 'asphalt', 'Asphalt']
        is_tile = rtype in ['بلاط', 'tile', 'Tile']
        is_terr = rtype in ['ترابي', 'terrestrial', 'Terrestrial']
        
        if is_asphalt:
            asphalt['total'] += t
            asphalt['licensed'] += g.get('licensed', 0)
            asphalt['unlicensed'] += g.get('unlicensed', 0)
        elif is_tile:
            tile['total'] += t
            tile['licensed'] += g.get('licensed', 0)
            tile['unlicensed'] += g.get('unlicensed', 0)
        elif is_terr:
            terrestrial['total'] += t
            terrestrial['licensed'] += g.get('licensed', 0)
            terrestrial['unlicensed'] += g.get('unlicensed', 0)

    result = [{
        'total': [{'count': total}],
        'fixed': [{'count': fixed}],
        'asphalt_remaining': [{'count': asphalt_remaining}],
        'asphalt_reports': [asphalt] if asphalt['total'] > 0 else [],
        'tile_reports': [tile] if tile['total'] > 0 else [],
        'terrestrial_reports': [terrestrial] if terrestrial['total'] > 0 else [],
        'by_type': [{'_id': k, 'count': v} for k, v in by_type.items()]
    }]
    
    """
        
        # Replace the code in the function
        new_func = original_func[:pipeline_start_idx] + new_pipeline_code + original_func[allow_disk_use_idx:]
        
        new_content = content.replace(original_func, new_func)
        with open('backend/server.py', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully optimized get_reports_stats pipeline!")
    else:
        print("Could not find pipeline indices")
