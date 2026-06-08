import codecs

with codecs.open('backend/server.py', 'r', 'utf-8') as f:
    content = f.read()

# 1. Inject start_time / end_time logic
content = content.replace('seventy_two_hours_ago = reference_time - timedelta(hours=72)',
'''seventy_two_hours_ago = reference_time - timedelta(hours=72)

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

# 2. Inject logic inside get_governorate_48h_counts
loop1_target = '''            except Exception:
                pass
        
        #  2: created_at'''
loop1_replacement = '''            except Exception:
                pass
        
        if base_date:
            if report_date and start_time and end_time and start_time <= report_date <= end_time:
                key = (governorate, project_val)
                group_counts[key] = group_counts.get(key, 0) + 1
            continue
        
        #  2: created_at'''
content = content.replace(loop1_target, loop1_replacement)

# 3. Inject logic inside get_reports_last_72_hours_list
loop2_target = '''            except Exception:
                pass
        
        #  2: created_at fallback'''
loop2_replacement = '''            except Exception:
                pass
        
        if base_date:
            if report_date and start_time and end_time and start_time <= report_date <= end_time:
                reports.append(report)
            continue
        
        #  2: created_at fallback'''
content = content.replace(loop2_target, loop2_replacement)

with codecs.open('backend/server.py', 'w', 'utf-8') as f:
    f.write(content)

print("Patch applied successfully!")
