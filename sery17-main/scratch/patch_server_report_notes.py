import re

file_path = "d:/sery17-main/sery17-main/backend/server.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update projection in get_report_notes
content = content.replace(
    '{"_id": 0, "id": 1, "report_number": 1, "project": 1, "governorate": 1, "contractor": 1, "notes": 1, "report_note_processed": 1, "report_note_processed_date": 1, "created_at": 1, "status": 1}',
    '{"_id": 0, "id": 1, "report_number": 1, "project": 1, "governorate": 1, "contractor": 1, "notes": 1, "report_note_reply": 1, "report_note_replied_by": 1, "report_note_processed": 1, "report_note_processed_date": 1, "created_at": 1, "status": 1}'
)

# 2. Add endpoints for report_note_reply and report_note_processed
# I'll insert them right after `delete_report_note` endpoint.

new_endpoints = """
@api_router.put("/reports/{report_id}/report_note_processed")
async def toggle_report_note_processed(report_id: str, current_user: User = Depends(get_current_user)):
    report = await db.reports.find_one({"id": report_id})
    if not report: raise HTTPException(status_code=404, detail="Report not found")
    
    user_role = getattr(current_user, "role", current_user.get("role") if isinstance(current_user, dict) else None)
    can_create = getattr(current_user, "can_create_subusers", current_user.get("can_create_subusers") if isinstance(current_user, dict) else False)
    
    if user_role != "admin" and not can_create:
        raise HTTPException(status_code=403, detail="Only Level 1 and Level 2 can process report notes")
    
    current_status = report.get("report_note_processed", False)
    new_status = not current_status
    
    from datetime import datetime, timezone
    update_data = {"report_note_processed": new_status}
    if new_status:
        update_data["report_note_processed_date"] = datetime.now(timezone.utc).isoformat()
    else:
        update_data["report_note_processed_date"] = ""
        
    await db.reports.update_one({"id": report_id}, {"$set": update_data})
    return {"success": True, "report_note_processed": new_status, "report_note_processed_date": update_data.get("report_note_processed_date", "")}

class ReportNoteReply(BaseModel):
    reply: str

@api_router.put("/reports/{report_id}/report_note_reply")
async def update_report_note_reply(report_id: str, payload: ReportNoteReply, current_user: User = Depends(get_current_user)):
    report = await db.reports.find_one({"id": report_id})
    if not report: raise HTTPException(status_code=404, detail="Report not found")
    
    user_doc = current_user.model_dump() if hasattr(current_user, 'model_dump') else current_user
    if not has_project_permission(user_doc, report.get("project"), "consultant_notes") and user_doc.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only consultant can reply to this note")
        
    replier_name = current_user.full_name if getattr(current_user, 'full_name', None) else current_user.username
    update_data = {
        "report_note_reply": payload.reply,
        "report_note_replied_by": replier_name if payload.reply else ""
    }
    
    if not payload.reply:
        update_data["report_note_processed"] = False
        
    await db.reports.update_one({"id": report_id}, {"$set": update_data})
    
    return {"success": True, "reply": payload.reply, "replied_by": update_data["report_note_replied_by"]}
"""

delete_report_note_str = """    await db.reports.update_one({"id": report_id}, {"$set": {"notes": ""}})
    return {"success": True}"""

content = content.replace(delete_report_note_str, delete_report_note_str + "\n" + new_endpoints)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied for server.py")
