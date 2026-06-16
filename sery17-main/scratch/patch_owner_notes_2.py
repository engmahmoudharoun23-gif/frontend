import re

# 1. Update Reports.js
file_path = "d:/sery17-main/sery17-main/frontend/src/pages/Reports.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """      const prefix = `ملاحظه عن بلاغ رقم ${r.report_number || ''} من المالك:\\n`;"""
new_code = """      const userName = user?.full_name || user?.username || '';
      const prefix = `ملاحظه عن بلاغ رقم ${r.report_number || ''} من المالك ${userName}:\\n`;"""
content = content.replace(old_code, new_code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# 2. Update server.py
file_path_backend = "d:/sery17-main/sery17-main/backend/server.py"
with open(file_path_backend, "r", encoding="utf-8") as f:
    backend_content = f.read()

# Update PUT report-note to set report_note_processed to False
old_put_note = """    await db.reports.update_one({"id": report_id}, {"$set": {"notes": payload.notes}})"""
new_put_note = """    update_data = {"notes": payload.notes}
    if payload.notes:
        update_data["report_note_processed"] = False
    await db.reports.update_one({"id": report_id}, {"$set": update_data})"""
backend_content = backend_content.replace(old_put_note, new_put_note)

# Add report_notes to badges in get_dashboard_badges
# Find the badges dict
old_badges = """"safety": 0, "quality": 0, "warehouse": 0, "business": 0,
        "safety_notes": 0, "quality_notes": 0, "work_permits_notes": 0, "violations_notes": 0,
        "work_permits": 0, "violations": 0"""
new_badges = """"safety": 0, "quality": 0, "warehouse": 0, "business": 0,
        "safety_notes": 0, "quality_notes": 0, "work_permits_notes": 0, "violations_notes": 0,
        "work_permits": 0, "violations": 0, "report_notes": 0"""
backend_content = backend_content.replace(old_badges, new_badges)

# Add the count logic
# Find where keys.append("violations_notes") is
old_violations = """        keys.append("violations_notes")"""
new_violations = """        keys.append("violations_notes")
        
    if role == "admin" or "report_notes" in user_perms:
        tasks.append(db.reports.count_documents(get_query({"notes": {"$ne": "", "$exists": True}, "report_note_processed": {"$ne": True}})))
        keys.append("report_notes")"""
backend_content = backend_content.replace(old_violations, new_violations)

with open(file_path_backend, "w", encoding="utf-8") as f:
    f.write(backend_content)

print("Patch applied")
