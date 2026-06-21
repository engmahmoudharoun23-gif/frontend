import codecs

endpoint = """

class ConsultantNoteUpdate(BaseModel):
    consultant_note: str

@app.put("/reports/{report_id}/consultant_note")
async def update_consultant_note(report_id: str, payload: ConsultantNoteUpdate, current_user: User = Depends(get_current_active_user)):
    report = await db.reports.find_one({"id": report_id})
    if not report: raise HTTPException(status_code=404, detail="Report not found")
    
    await db.reports.update_one({"id": report_id}, {"$set": {"consultant_note": payload.consultant_note}})
    
    creator_id = report.get("created_by")
    creator = await db.users.find_one({"$or": [{"id": creator_id}, {"username": creator_id}]})
    
    if creator and payload.consultant_note:
        import uuid
        from datetime import datetime, timezone
        message_id = str(uuid.uuid4())
        new_msg = {
            "id": message_id,
            "sender_id": current_user.id,
            "receiver_id": creator["id"],
            "message": f"تمت إضافة/تعديل ملاحظة الاستشاري على البلاغ {report.get('report_number', '')}:\\n{payload.consultant_note}",
            "created_at": datetime.now(timezone.utc),
            "is_read": False,
            "is_delivered": False,
            "is_edited": False
        }
        await db.messages.insert_one(new_msg)
        
    return {"message": "Success", "consultant_note": payload.consultant_note}
"""

with codecs.open('backend/server.py', 'a', encoding='utf-8') as f:
    f.write(endpoint)

print("Endpoint added.")
