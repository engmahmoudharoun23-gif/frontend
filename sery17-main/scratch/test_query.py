import asyncio
import sys
import os

sys.path.append(r'd:\sery17-main\sery17-main\backend')
import server
from database import db

async def test():
    await db.client.admin.command('ping')
    
    # 1. Find a user named Mukhtar
    user = await db.users.find_one({"full_name": {"$regex": "مختار"}})
    if not user:
        print("User not found")
        return
        
    print(f"User found: {user['full_name']}")
    print(f"Permissions: {user.get('permissions')}")
    
    # Simulate get_reports
    project = None
    
    query = {"is_deleted": {"$ne": True}}
    
    is_manager = user.get("can_create_subusers", False)
    can_view_all = server.has_project_permission(user, project, "view_governorate_data")
    print(f"is_manager: {is_manager}")
    print(f"can_view_all: {can_view_all}")
    
    if not is_manager and not can_view_all:
        query["created_by"] = user.get("username")
        print("ADDED created_by restriction!")
    else:
        print("SKIPPED created_by restriction! The user will see all data.")
        
    # Apply governorate filter
    if len(user.get('governorates', [])) > 0:
        query["governorate"] = {"$in": user.get('governorates', [])}
        print(f"Applied governorate filter: {query['governorate']}")
        
    print(f"Final Query: {query}")
    
    # Count reports
    count = await db.reports.count_documents(query)
    print(f"Total reports visible: {count}")

if __name__ == "__main__":
    asyncio.run(test())
