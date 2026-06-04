import io

with io.open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_gov = False
in_list = False

# We use state machine to inject EXACTLY once per function
injected_date_gov = False
injected_date_list = False
injected_loop_gov = False
injected_loop_list = False

for line in lines:
    if 'def get_governorate_48h_counts' in line:
        in_gov = True
    if 'def get_reports_last_72_hours_list' in line:
        in_list = True
        in_gov = False
    if 'def export_72h_reports_excel' in line:
        in_list = False
    
    # 1. Inject date calculation
    if 'seventy_two_hours_ago = reference_time - timedelta(hours=72)' in line:
        new_lines.append(line)
        if in_gov and not injected_date_gov:
            new_lines.append('''
    start_time = None
    end_time = None
    if base_date:
        try:
            base_dt = datetime.fromisoformat(base_date.replace('Z', '+00:00'))
            if base_dt.tzinfo:
                base_dt = base_dt.replace(tzinfo=None)
            start_time = base_dt.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = base_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        except:
            pass
''')
            injected_date_gov = True
            
        elif in_list and not injected_date_list:
            new_lines.append('''
    start_time = None
    end_time = None
    if base_date:
        try:
            base_dt = datetime.fromisoformat(base_date.replace('Z', '+00:00'))
            if base_dt.tzinfo:
                base_dt = base_dt.replace(tzinfo=None)
            start_time = base_dt.replace(hour=0, minute=0, second=0, microsecond=0)
            end_time = base_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        except:
            pass
''')
            injected_date_list = True
        continue
        
    # 2. Inject gov loop
    if in_gov and not injected_loop_gov and 'if not report_date and isinstance(created_at, datetime):' in line:
        new_lines.append('''        if base_date:
            if report_date and start_time and end_time and start_time <= report_date <= end_time:
                key = (governorate, project_val)
                group_counts[key] = group_counts.get(key, 0) + 1
            continue
''')
        new_lines.append(line)
        injected_loop_gov = True
        continue
        
    # 3. Inject list loop
    if in_list and not injected_loop_list and 'if not report_date and isinstance(created_at, datetime):' in line:
        new_lines.append('''        if base_date:
            if report_date and start_time and end_time and start_time <= report_date <= end_time:
                reports.append(report)
            continue
''')
        new_lines.append(line)
        injected_loop_list = True
        continue
        
    new_lines.append(line)

with io.open('backend/server.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Patch applied by safe state machine!")
