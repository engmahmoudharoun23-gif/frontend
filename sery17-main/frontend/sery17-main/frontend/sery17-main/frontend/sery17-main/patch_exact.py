import io

with io.open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Normalize line endings
content = content.replace('\r\n', '\n')

old_date_calc = """    # حساب الوقت قبل 72 ساعة بالضبط
    seventy_two_hours_ago = reference_time - timedelta(hours=72)"""

new_date_calc = """    # حساب الوقت قبل 72 ساعة بالضبط
    seventy_two_hours_ago = reference_time - timedelta(hours=72)

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
            pass"""

old_loop_1 = """            except Exception:
                pass
        
        # أولوية 2: created_at
        if not report_date and isinstance(created_at, datetime):"""

new_loop_1 = """            except Exception:
                pass
        
        if base_date:
            if report_date and start_time and end_time and start_time <= report_date <= end_time:
                key = (governorate, project_val)
                group_counts[key] = group_counts.get(key, 0) + 1
            continue
        
        # أولوية 2: created_at
        if not report_date and isinstance(created_at, datetime):"""

old_loop_2 = """            except Exception:
                pass
        
        # أولوية 2: created_at fallback
        if not report_date and isinstance(created_at, datetime):"""

new_loop_2 = """            except Exception:
                pass
        
        if base_date:
            if report_date and start_time and end_time and start_time <= report_date <= end_time:
                reports.append(report)
            continue
        
        # أولوية 2: created_at fallback
        if not report_date and isinstance(created_at, datetime):"""

content = content.replace(old_date_calc, new_date_calc)
content = content.replace(old_loop_1, new_loop_1)
content = content.replace(old_loop_2, new_loop_2)

with io.open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied exact replacements!")
