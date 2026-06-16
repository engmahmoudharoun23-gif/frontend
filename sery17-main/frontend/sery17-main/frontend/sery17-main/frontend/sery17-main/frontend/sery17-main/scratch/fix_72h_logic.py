import re

server_file = r"d:\sery17-main\sery17-main\backend\server.py"

with open(server_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update get_governorate_48h_counts
counts_logic_old = """    # حساب الوقت المرجعي (الآن أو التاريخ المختار)
    if base_date:
        try:
            base_dt = datetime.fromisoformat(base_date.replace('Z', '+00:00'))
            if base_dt.tzinfo:
                base_dt = base_dt.replace(tzinfo=None)
            reference_time = base_dt
        except:
            reference_time = datetime.utcnow()
    else:
        reference_time = datetime.utcnow()

    # حساب الوقت قبل 72 ساعة بالضبط
    seventy_two_hours_ago = reference_time - timedelta(hours=72)"""

counts_logic_new = """    # حساب نطاق التاريخ إذا تم تمرير base_date، أو استخدام آخر 72 ساعة كافتراضي
    target_date_start = None
    target_date_end = None
    seventy_two_hours_ago = None
    
    if base_date:
        try:
            base_dt = datetime.fromisoformat(base_date.split('T')[0])
            target_date_start = datetime(base_dt.year, base_dt.month, base_dt.day)
            target_date_end = target_date_start + timedelta(days=1) - timedelta(microseconds=1)
        except Exception as e:
            print("Error parsing base_date:", e)
    
    if not target_date_start:
        seventy_two_hours_ago = datetime.utcnow() - timedelta(hours=72)"""

content = content.replace(counts_logic_old, counts_logic_new)

counts_check_old = """        # التحقق من أن التاريخ ضمن 72 ساعة
        if report_date and report_date >= seventy_two_hours_ago:
            key = (governorate, project_val)
            group_counts[key] = group_counts.get(key, 0) + 1"""

counts_check_new = """        # التحقق من أن التاريخ يطابق اليوم المحدد أو ضمن 72 ساعة
        is_included = False
        if target_date_start:
            if report_date and target_date_start <= report_date <= target_date_end:
                is_included = True
        else:
            if report_date and report_date >= seventy_two_hours_ago:
                is_included = True
                
        if is_included:
            key = (governorate, project_val)
            group_counts[key] = group_counts.get(key, 0) + 1"""

content = content.replace(counts_check_old, counts_check_new)

# 2. Update get_reports_last_72_hours_list
list_logic_old = """    # حساب الوقت المرجعي
    if base_date:
        try:
            base_dt = datetime.fromisoformat(base_date.replace('Z', '+00:00'))
            if base_dt.tzinfo:
                base_dt = base_dt.replace(tzinfo=None)
            reference_time = base_dt
        except:
            reference_time = datetime.utcnow()
    else:
        reference_time = datetime.utcnow()

    # حساب الوقت قبل 72 ساعة بالضبط
    seventy_two_hours_ago = reference_time - timedelta(hours=72)"""

list_logic_new = """    # حساب نطاق التاريخ إذا تم تمرير base_date، أو استخدام آخر 72 ساعة كافتراضي
    target_date_start = None
    target_date_end = None
    seventy_two_hours_ago = None
    
    if base_date:
        try:
            base_dt = datetime.fromisoformat(base_date.split('T')[0])
            target_date_start = datetime(base_dt.year, base_dt.month, base_dt.day)
            target_date_end = target_date_start + timedelta(days=1) - timedelta(microseconds=1)
        except Exception as e:
            print("Error parsing base_date in list:", e)
    
    if not target_date_start:
        seventy_two_hours_ago = datetime.utcnow() - timedelta(hours=72)"""

content = content.replace(list_logic_old, list_logic_new)

list_check_old = """        if report_date and report_date >= seventy_two_hours_ago:
            reports.append(report)"""

list_check_new = """        is_included = False
        if target_date_start:
            if report_date and target_date_start <= report_date <= target_date_end:
                is_included = True
        else:
            if report_date and report_date >= seventy_two_hours_ago:
                is_included = True
                
        if is_included:
            reports.append(report)"""

content = content.replace(list_check_old, list_check_new)

with open(server_file, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated 72-hour logic successfully.")
