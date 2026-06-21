import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import io

async def check_users():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    with io.open('scratch/medhat_users_output.txt', 'w', encoding='utf-8') as f:
        # 1. Find Medhat's user
        medhat_users = await db.users.find({"full_name": {"$regex": "مدحت", "$options": "i"}}).to_list(None)
        f.write(f"--- Medhat Users ({len(medhat_users)}) ---\n")
        medhat_ids = []
        for u in medhat_users:
            f.write(f"ID: {u.get('id', u.get('_id'))} - Name: {u.get('full_name')} - Role: {u.get('role')} - Level: {u.get('level')} - Is Deleted: {u.get('is_deleted', False)}\n")
            medhat_ids.append(u.get('id'))

        f.write("\n--- All Users ---\n")
        all_users = await db.users.find({}).to_list(None)
        f.write(f"Total users in DB: {len(all_users)}\n")
        
        f.write("\n--- All Users List ---\n")
        for u in all_users:
            f.write(f"ID: {u.get('id')} - Name: {u.get('full_name')} - Role: {u.get('role')} - Created By: {u.get('created_by', 'None')}\n")

        f.write("\n--- Deleted Users ---\n")
        deleted_users = await db.users.find({"is_deleted": True}).to_list(None)
        for u in deleted_users:
            f.write(f"Name: {u.get('full_name')} - Role: {u.get('role')}\n")

        f.write("\n--- Users Created by Medhat ---\n")
        for mid in medhat_ids:
            users_by_medhat = await db.users.find({"created_by": mid}).to_list(None)
            f.write(f"Users created by Medhat (ID: {mid}): {len(users_by_medhat)}\n")
            for u in users_by_medhat:
                f.write(f"  - Name: {u.get('full_name')} - Role: {u.get('role')} - Is Deleted: {u.get('is_deleted', False)}\n")

    client.close()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(check_users())
