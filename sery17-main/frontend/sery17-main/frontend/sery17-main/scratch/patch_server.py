import sys
import re

file_path = "backend/server.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

models_code = """
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    text: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_deleted: bool = False

class ChatMessageCreate(BaseModel):
    receiver_id: str
    text: Optional[str] = None
    image_url: Optional[str] = None
"""

endpoints_code = """
# ============= CHAT ENDPOINTS =============

@api_router.get("/chat/contacts")
async def get_chat_contacts(current_user: User = Depends(get_current_user)):
    contacts = []
    
    if current_user.role == 'admin':
        # Admin can chat with Level 2 users (users who can create subusers)
        users = await db.users.find({"can_create_subusers": True, "id": {"$ne": current_user.id}}, {"id": 1, "username": 1, "full_name": 1, "profile_picture": 1, "role": 1, "can_create_subusers": 1}).to_list(1000)
        contacts.extend(users)
    elif current_user.can_create_subusers:
        # Level 2 can chat with Admin and their Level 3 subusers
        admins = await db.users.find({"role": "admin"}, {"id": 1, "username": 1, "full_name": 1, "profile_picture": 1, "role": 1, "can_create_subusers": 1}).to_list(100)
        contacts.extend(admins)
        
        subusers = await db.users.find({"created_by": current_user.id}, {"id": 1, "username": 1, "full_name": 1, "profile_picture": 1, "role": 1, "can_create_subusers": 1}).to_list(1000)
        contacts.extend(subusers)
    else:
        # Level 3 can chat with their Level 2 manager
        if hasattr(current_user, 'created_by') and current_user.created_by:
            manager = await db.users.find_one({"id": current_user.created_by}, {"id": 1, "username": 1, "full_name": 1, "profile_picture": 1, "role": 1, "can_create_subusers": 1})
            if manager:
                contacts.append(manager)
        else:
            # Fallback if created_by is somehow missing: they can chat with all Level 2 users in their projects
            # This is a generic fallback, but strict hierarchy says created_by
            managers = await db.users.find({"can_create_subusers": True}, {"id": 1, "username": 1, "full_name": 1, "profile_picture": 1, "role": 1, "can_create_subusers": 1}).to_list(100)
            contacts.extend(managers)
            
    # Remove duplicates
    seen = set()
    unique_contacts = []
    for c in contacts:
        if c["id"] not in seen and c["id"] != current_user.id:
            seen.add(c["id"])
            
            # Get unread count (not implemented yet, but we'll default to 0)
            # You could add unread count logic here
            c["unread_count"] = 0
            
            # Get last message
            last_msg = await db.chat_messages.find_one(
                {
                    "$or": [
                        {"sender_id": current_user.id, "receiver_id": c["id"]},
                        {"sender_id": c["id"], "receiver_id": current_user.id}
                    ],
                    "is_deleted": False
                },
                sort=[("created_at", -1)]
            )
            if last_msg:
                c["last_message"] = last_msg.get("text") if last_msg.get("text") else "صورة 📷"
                c["last_message_time"] = last_msg.get("created_at")
            
            unique_contacts.append(c)
            
    # Sort by last message time
    unique_contacts.sort(key=lambda x: x.get("last_message_time", datetime.min), reverse=True)
            
    # Convert ObjectIds and datetime to string if needed, FastAPI handles datetime usually
    return [{"id": c["id"], "name": c.get("full_name") or c.get("username"), "avatar": c.get("profile_picture"), "last_message": c.get("last_message"), "last_message_time": c.get("last_message_time")} for c in unique_contacts]

@api_router.get("/chat/messages/{contact_id}")
async def get_chat_messages(contact_id: str, current_user: User = Depends(get_current_user)):
    messages = await db.chat_messages.find(
        {
            "$or": [
                {"sender_id": current_user.id, "receiver_id": contact_id},
                {"sender_id": contact_id, "receiver_id": current_user.id}
            ],
            "is_deleted": False
        }
    ).sort("created_at", 1).to_list(500)
    
    # Mark messages as read could go here
    
    for msg in messages:
        msg["_id"] = str(msg["_id"])
    return messages

@api_router.post("/chat/messages")
async def send_chat_message(msg_in: dict, current_user: User = Depends(get_current_user)):
    if not msg_in.get("receiver_id"):
        raise HTTPException(status_code=400, detail="Receiver ID is required")
    if not msg_in.get("text") and not msg_in.get("image_url"):
        raise HTTPException(status_code=400, detail="Text or image is required")
        
    new_msg = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user.id,
        "receiver_id": msg_in.get("receiver_id"),
        "text": msg_in.get("text"),
        "image_url": msg_in.get("image_url"),
        "created_at": datetime.utcnow(),
        "is_deleted": False
    }
    await db.chat_messages.insert_one(new_msg)
    new_msg["_id"] = str(new_msg["_id"])
    return new_msg

@api_router.delete("/chat/messages/{message_id}")
async def delete_chat_message(message_id: str, current_user: User = Depends(get_current_user)):
    msg = await db.chat_messages.find_one({"id": message_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if msg["sender_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="لا يمكنك حذف رسالة لم ترسلها")
        
    await db.chat_messages.update_one({"id": message_id}, {"$set": {"is_deleted": True}})
    return {"message": "Message deleted successfully"}
"""

# Inject models after UserUpdate
if "class UserUpdate(BaseModel):" in content:
    content = content.replace("class UserUpdate(BaseModel):", models_code + "\nclass UserUpdate(BaseModel):")
else:
    print("Could not find insertion point for models")

# Inject endpoints before # ============= APP STARTUP =============
if "# ============= APP STARTUP =============" in content:
    content = content.replace("# ============= APP STARTUP =============", endpoints_code + "\n# ============= APP STARTUP =============")
else:
    print("Could not find insertion point for endpoints")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Backend updated successfully!")
