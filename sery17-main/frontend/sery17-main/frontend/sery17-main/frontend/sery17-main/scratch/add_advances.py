import re
import os

SERVER_PATH = "d:/sery17-main/sery17-main/backend/server.py"

with open(SERVER_PATH, "r", encoding="utf-8") as f:
    server_content = f.read()

# Add Pydantic Model
pydantic_model = """
class AdvanceCustody(BaseModel):
    id: Optional[str] = None
    employee_name: str
    project: Optional[str] = None
    company: Optional[str] = None
    type: str
    amount: Optional[float] = 0
    item_description: Optional[str] = None
    date: str
    status: str
    notes: Optional[str] = None
"""

if "class AdvanceCustody" not in server_content:
    # Insert after class HRSalary
    server_content = re.sub(
        r'(class HRSalary.*?)(?=\n@api_router)',
        r'\1\n' + pydantic_model,
        server_content,
        flags=re.DOTALL
    )

# Add API Routes
api_routes = """
@api_router.get("/hr/advances-custodies")
async def get_advances_custodies(current_user: User = Depends(get_current_user)):
    user_permissions = current_user.permissions or []
    has_hr_perm = ("hr_management" in user_permissions) or user_has_any_project_permission(current_user, "hr_management")
    if current_user.role != "admin" and not has_hr_perm:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية")
    
    docs = await db.hr_advances_custodies.find({}, {"_id": 0}).to_list(1000)
    return docs

@api_router.post("/hr/advances-custodies")
async def create_advance_custody(data: AdvanceCustody, current_user: User = Depends(get_current_user)):
    user_permissions = current_user.permissions or []
    has_hr_perm = ("hr_management" in user_permissions) or user_has_any_project_permission(current_user, "hr_management")
    if current_user.role != "admin" and not has_hr_perm:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية")
        
    doc = data.model_dump(exclude_none=True)
    if 'id' not in doc or not doc['id']:
        import uuid
        doc['id'] = str(uuid.uuid4())
    doc["created_by"] = current_user.username
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.hr_advances_custodies.insert_one(doc)
    return {"message": "تم الإضافة بنجاح", "id": doc['id']}

@api_router.put("/hr/advances-custodies/{item_id}")
async def update_advance_custody(item_id: str, data: AdvanceCustody, current_user: User = Depends(get_current_user)):
    user_permissions = current_user.permissions or []
    has_hr_perm = ("hr_management" in user_permissions) or user_has_any_project_permission(current_user, "hr_management")
    if current_user.role != "admin" and not has_hr_perm:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية")
        
    update_data = data.model_dump(exclude={"id"}, exclude_none=True)
    await db.hr_advances_custodies.update_one({"id": item_id}, {"$set": update_data})
    return {"message": "تم التعديل بنجاح"}

@api_router.delete("/hr/advances-custodies/{item_id}")
async def delete_advance_custody(item_id: str, current_user: User = Depends(get_current_user)):
    user_permissions = current_user.permissions or []
    has_hr_perm = ("hr_management" in user_permissions) or user_has_any_project_permission(current_user, "hr_management")
    if current_user.role != "admin" and not has_hr_perm:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية")
        
    await db.hr_advances_custodies.delete_one({"id": item_id})
    return {"message": "تم الحذف بنجاح"}
"""

if "/hr/advances-custodies" not in server_content:
    # Insert before get_hr_alerts
    server_content = server_content.replace(
        '@api_router.get("/hr/alerts")',
        api_routes + '\n@api_router.get("/hr/alerts")'
    )

with open(SERVER_PATH, "w", encoding="utf-8") as f:
    f.write(server_content)
    print("server.py updated successfully")
