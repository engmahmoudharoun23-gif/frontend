import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the corruption
bad_content = """    transpclass ConsultantNoteUpdate(BaseModel):
    consultant_note: str

@api_router.put("/reports/{report_id}/consultant_note")
async def update_consultant_note(report_id: str, payload: ConsultantNoteUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and getattr(current_user, 'can_create_subusers', False) != True and current_user.role != "level2":
        raise HTTPException(status_code=403, detail="Not authorized to add consultant notes")
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

# Include router - MUST be after ALL endpoint definitions
app.include_router(api_router)id", None)"""

good_content = """    transport_allowance: float = 0
    other_allowances: float = 0
    overtime: float = 0
    bonus: float = 0
    deduction_type: Optional[str] = None
    deduction_amount: float = 0
    month: int
    year: int
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# الموظفين

class AdvanceCustody(BaseModel):
    id: Optional[str] = None
    employee_name: str
    employee_number: Optional[str] = None
    project: Optional[str] = None
    company: Optional[str] = None
    type: str
    amount: Optional[float] = 0
    paid_amount: Optional[float] = 0
    remaining_amount: Optional[float] = 0
    item_description: Optional[str] = None
    date: str
    status: str
    action_date: Optional[str] = None
    notes: Optional[str] = None
    payment_history: Optional[list] = []

@api_router.get("/hr/employees")
async def get_hr_employees(current_user: User = Depends(get_current_user)):
    employees = await db.hr_employees.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return employees

@api_router.post("/hr/employees")
async def create_hr_employee(employee: HREmployee, current_user: User = Depends(get_current_user)):
    employee_dict = employee.model_dump()
    employee_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.hr_employees.insert_one(employee_dict)
    employee_dict.pop("_id", None)
    return employee_dict

@api_router.put("/hr/employees/{employee_id}")
async def update_hr_employee(employee_id: str, employee_data: dict, current_user: User = Depends(get_current_user)):
    employee_data.pop("id", None)"""

# Fix line endings just in case
bad_content = bad_content.replace('\r\n', '\n')
good_content = good_content.replace('\r\n', '\n')
content = content.replace('\r\n', '\n')

content = content.replace(bad_content, good_content)

# 2. Fix the original endpoint at the end
bad_end = """app.include_router(api_router)


class ConsultantNoteUpdate(BaseModel):
    consultant_note: str

@app.put("/reports/{report_id}/consultant_note")
async def update_consultant_note(report_id: str, payload: ConsultantNoteUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and getattr(current_user, 'can_create_subusers', False) != True and current_user.role != "level2":
        raise HTTPException(status_code=403, detail="Not authorized to add consultant notes")
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

good_end = """class ConsultantNoteUpdate(BaseModel):
    consultant_note: str

@api_router.put("/reports/{report_id}/consultant_note")
async def update_consultant_note(report_id: str, payload: ConsultantNoteUpdate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and getattr(current_user, 'can_create_subusers', False) != True and current_user.role != "level2":
        raise HTTPException(status_code=403, detail="Not authorized to add consultant notes")
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

app.include_router(api_router)
"""

bad_end = bad_end.replace('\r\n', '\n')
good_end = good_end.replace('\r\n', '\n')
content = content.replace(bad_end, good_end)

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fix applied.")
