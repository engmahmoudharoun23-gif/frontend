import os
import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

endpoints = '''

# ============= MEETINGS MODULE =============
import uuid

@api_router.get("/meetings")
async def get_meetings(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if current_user.role != "admin" and not has_permission(current_user, "meetings"):
        raise HTTPException(status_code=403, detail="غير مصرح")
        
    total = await db.meetings.count_documents(query)
    meetings = await db.meetings.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Remove _id from dicts
    for m in meetings:
        if "_id" in m:
            del m["_id"]
            
    return {"total": total, "meetings": meetings}

@api_router.post("/meetings")
async def create_meeting(
    title: str = Form(...),
    type: str = Form(...),
    date: str = Form(...),
    contractor_consultant: str = Form(...),
    description: str = Form(""),
    pdf: Optional[UploadFile] = File(None),
    images: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and not has_permission(current_user, "meetings"):
        raise HTTPException(status_code=403, detail="غير مصرح")

    meeting_id = str(uuid.uuid4())
    pdf_path = None
    image_paths = []

    # Process PDF
    if pdf and pdf.filename:
        ext = os.path.splitext(pdf.filename)[1]
        pdf_filename = f"meeting_pdf_{meeting_id}{ext}"
        p_path = os.path.join(UPLOADS_DIR, pdf_filename)
        with open(p_path, "wb") as buffer:
            shutil.copyfileobj(pdf.file, buffer)
        pdf_path = f"/uploads/{pdf_filename}"

    # Process Images
    for img in images:
        if img and img.filename:
            ext = os.path.splitext(img.filename)[1]
            img_filename = f"meeting_img_{uuid.uuid4()}{ext}"
            img_full_path = os.path.join(UPLOADS_DIR, img_filename)
            with open(img_full_path, "wb") as buffer:
                shutil.copyfileobj(img.file, buffer)
            image_paths.append(f"/uploads/{img_filename}")

    new_meeting = {
        "id": meeting_id,
        "title": title,
        "type": type,
        "date": date,
        "contractor_consultant": contractor_consultant,
        "description": description,
        "pdf_path": pdf_path,
        "images": image_paths,
        "created_by": current_user.username,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    await db.meetings.insert_one(new_meeting.copy())
    return {"message": "تم إضافة الاجتماع بنجاح", "meeting": new_meeting}

@api_router.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and not has_permission(current_user, "meetings"):
        raise HTTPException(status_code=403, detail="غير مصرح")
        
    meeting = await db.meetings.find_one({"id": meeting_id})
    if not meeting:
        raise HTTPException(status_code=404, detail="الاجتماع غير موجود")
        
    # Delete files
    if meeting.get("pdf_path"):
        try:
            os.remove(os.path.join(UPLOADS_DIR, os.path.basename(meeting["pdf_path"])))
        except: pass
        
    for img_path in meeting.get("images", []):
        try:
            os.remove(os.path.join(UPLOADS_DIR, os.path.basename(img_path)))
        except: pass

    await db.meetings.delete_one({"id": meeting_id})
    return {"message": "تم حذف الاجتماع بنجاح"}

@api_router.put("/meetings/{meeting_id}")
async def update_meeting(
    meeting_id: str,
    title: str = Form(...),
    type: str = Form(...),
    date: str = Form(...),
    contractor_consultant: str = Form(...),
    description: str = Form(""),
    existing_images: str = Form("[]"),
    existing_pdf: str = Form(""),
    pdf: Optional[UploadFile] = File(None),
    images: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and not has_permission(current_user, "meetings"):
        raise HTTPException(status_code=403, detail="غير مصرح")
        
    meeting = await db.meetings.find_one({"id": meeting_id})
    if not meeting:
        raise HTTPException(status_code=404, detail="الاجتماع غير موجود")

    import json
    try:
        kept_images = json.loads(existing_images)
    except:
        kept_images = []
    kept_pdf = existing_pdf if existing_pdf else None

    # delete removed files
    if meeting.get("pdf_path") and meeting.get("pdf_path") != kept_pdf and not pdf:
        try: os.remove(os.path.join(UPLOADS_DIR, os.path.basename(meeting["pdf_path"])))
        except: pass
        
    for old_img in meeting.get("images", []):
        if old_img not in kept_images:
            try: os.remove(os.path.join(UPLOADS_DIR, os.path.basename(old_img)))
            except: pass

    final_pdf_path = kept_pdf
    if pdf and pdf.filename:
        ext = os.path.splitext(pdf.filename)[1]
        pdf_filename = f"meeting_pdf_{meeting_id}_{uuid.uuid4().hex[:6]}{ext}"
        full_path = os.path.join(UPLOADS_DIR, pdf_filename)
        with open(full_path, "wb") as buffer:
            shutil.copyfileobj(pdf.file, buffer)
        final_pdf_path = f"/uploads/{pdf_filename}"
        
        # remove old pdf if replaced
        if meeting.get("pdf_path") and meeting.get("pdf_path") != final_pdf_path:
            try: os.remove(os.path.join(UPLOADS_DIR, os.path.basename(meeting["pdf_path"])))
            except: pass

    final_images = kept_images
    for img in images:
        if img and img.filename:
            ext = os.path.splitext(img.filename)[1]
            img_filename = f"meeting_img_{uuid.uuid4()}{ext}"
            img_full_path = os.path.join(UPLOADS_DIR, img_filename)
            with open(img_full_path, "wb") as buffer:
                shutil.copyfileobj(img.file, buffer)
            final_images.append(f"/uploads/{img_filename}")

    update_data = {
        "title": title,
        "type": type,
        "date": date,
        "contractor_consultant": contractor_consultant,
        "description": description,
        "pdf_path": final_pdf_path,
        "images": final_images,
        "updated_at": datetime.utcnow().isoformat()
    }

    await db.meetings.update_one({"id": meeting_id}, {"$set": update_data})
    
    meeting.update(update_data)
    if "_id" in meeting:
        del meeting["_id"]
    return {"message": "تم تعديل الاجتماع بنجاح", "meeting": meeting}

'''

content = content.replace('app.include_router(api_router)', endpoints + '\napp.include_router(api_router)')

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Backend updated successfully')
