import sys

filepath = 'd:/sery17-main/sery17-main/backend/server.py'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.read().splitlines()

start_idx = -1
for i, line in enumerate(lines):
    if '@api_router.delete("/reports/notifications/{report_id}")' in line:
        start_idx = i
        break

end_idx = -1
for i in range(start_idx, len(lines)):
    if 'raise HTTPException(status_code=500, detail="فشل في حذف الإشعار")' in lines[i]:
        end_idx = i
        break

# The new logic for delete single
new_func = """
@api_router.delete("/reports/notifications/{report_id}")
async def delete_report_notification(report_id: str, current_user: User = Depends(get_current_user)):
    \"\"\"
    حذف إشعار بلاغ واحد (إضافة المستخدم لقائمة deleted_notifications)
    هذا لا يحذف البلاغ نفسه، فقط يخفي الإشعار من القائمة
    \"\"\"
    try:
        # إضافة المستخدم لقائمة deleted_notifications للبلاغ المحدد
        result = await db.reports.update_one(
            {"id": report_id},
            {"$addToSet": {"deleted_notifications": current_user.id}}
        )
        
        if result.modified_count == 0:
            result = await db.water_connections.update_one(
                {"id": report_id},
                {"$addToSet": {"deleted_notifications": current_user.id}}
            )
            
        if result.modified_count == 0:
            result = await db.sewage_connections.update_one(
                {"id": report_id},
                {"$addToSet": {"deleted_notifications": current_user.id}}
            )
        
        return {"success": True, "message": "تم حذف الإشعار"}
        
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail="فشل في حذف الإشعار")
""".strip('\n').split('\n')

new_lines = lines[:start_idx] + new_func + lines[end_idx+1:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines) + '\n')
print("Patched single delete successfully.")
