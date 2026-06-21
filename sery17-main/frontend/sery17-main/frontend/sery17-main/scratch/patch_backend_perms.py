import codecs
import re

file_path = 'backend/server.py'
with codecs.open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = 'async def update_consultant_note(report_id: str, payload: ConsultantNoteUpdate, current_user: User = Depends(get_current_active_user)):'
replacement = """async def update_consultant_note(report_id: str, payload: ConsultantNoteUpdate, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin" and getattr(current_user, 'can_create_subusers', False) != True and current_user.role != "level2":
        raise HTTPException(status_code=403, detail="Not authorized to add consultant notes")"""

content = content.replace(target, replacement)

with codecs.open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend permissions added.")
