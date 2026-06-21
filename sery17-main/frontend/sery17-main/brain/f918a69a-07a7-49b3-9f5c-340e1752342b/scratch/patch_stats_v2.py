
import sys
import os

path = "d:/sery17-main/sery17-main/backend/server.py"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 1. Update date logic
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "# تصفية حسب الشهر" in line and 2930 < i < 2960:
        start_idx = i
    if "date_filter = {" in line and 2950 < i < 2980:
        # find the end of the date_filter dict
        for j in range(i, i+15):
            if "}" in lines[j] and "date_filter" not in lines[j]:
                end_idx = j
                break
        break

if start_idx != -1 and end_idx != -1:
    new_date_logic = """    # بناء الفلتر الزمني بشكل مرن وشامل
    if month:
        from datetime import datetime as dt, timezone
        year, month_num = month.split('-')
        
        # 1. فلتر التاريخ (للكائنات datetime Aware)
        date_from_obj_aware = dt(int(year), int(month_num), 1, 0, 0, 0, tzinfo=timezone.utc)
        if int(month_num) == 12:
            date_to_obj_aware = dt(int(year) + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            date_to_obj_aware = dt(int(year), int(month_num) + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

        # 2. فلتر التاريخ (للكائنات datetime Naive)
        date_from_obj_naive = date_from_obj_aware.replace(tzinfo=None)
        date_to_obj_naive = date_to_obj_aware.replace(tzinfo=None)
        
        # 3. فلتر النص (للصيغ النصية المختلفة)
        month_regex = f"^{month}" # YYYY-MM
        
        date_filter = {
            "$or": [
                {"created_at": {"$regex": month_regex}},
                {"created_at": {"$gte": date_from_obj_aware, "$lt": date_to_obj_aware}},
                {"created_at": {"$gte": date_from_obj_naive, "$lt": date_to_obj_naive}},
                {"created_at": {"$gte": f"{month}-01", "$lt": date_to_obj_naive.strftime("%Y-%m-%d")}}
            ]
        }
        
        if "$or" in query_filter:
            query_filter["$and"] = [{"$or": query_filter.pop("$or")}, date_filter]
        else:
            query_filter.update(date_filter)
"""
    # Replace lines from start_idx to end_idx + (some lines for the update logic)
    # Actually, I'll find where date_filter is used and replace up to there.
    for k in range(end_idx, end_idx + 10):
        if 'query_filter["$and"]' in lines[k] or 'query_filter.update(date_filter)' in lines[k]:
            end_idx = k
    
    lines[start_idx:end_idx+1] = [new_date_logic + "\n"]

# 2. Update facets (Fixed Asphalt, etc.)
facet_mapping = {
    "'fixed_asphalt'": """                'fixed_asphalt': [
                    {'$match': {
                        'report_type': {'$regex': '.*أسفلت.*|.*اسفلت.*|.*asphalt.*', '$options': 'i'}, 
                        'status': {'$regex': '.*تم الإصلاح.*|.*تم التنفيذ.*|.*مكتمل.*|.*Fixed.*|.*Completed.*', '$options': 'i'}
                    }},
                    {'$count': 'count'}
                ],""",
    "'fixed_dirt'": """                'fixed_dirt': [
                    {'$match': {
                        'report_type': {'$regex': '.*تراب.*|.*dirt.*', '$options': 'i'}, 
                        'status': {'$regex': '.*تم الإصلاح.*|.*تم التنفيذ.*|.*مكتمل.*|.*Fixed.*|.*Completed.*', '$options': 'i'}
                    }},
                    {'$count': 'count'}
                ],""",
    "'fixed_tiles'": """                'fixed_tiles': [
                    {'$match': {
                        'report_type': {'$regex': '.*بلاط.*|.*انترلوك.*|.*tiles.*', '$options': 'i'}, 
                        'status': {'$regex': '.*تم الإصلاح.*|.*تم التنفيذ.*|.*مكتمل.*|.*Fixed.*|.*Completed.*', '$options': 'i'}
                    }},
                    {'$count': 'count'}
                ],"""
}

for i in range(len(lines)):
    for key, val in facet_mapping.items():
        if key in lines[i] and "{" in lines[i] and ":" in lines[i]:
            # find end of this facet
            start_f = i
            end_f = -1
            for j in range(i, i+10):
                if "]," in lines[j]:
                    end_f = j
                    break
            if end_f != -1:
                lines[start_f:end_f+1] = [val + "\n"]
                break

with open(path, "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Patched stats logic and facets")
